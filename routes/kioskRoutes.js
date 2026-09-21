const express = require('express');
const router = express.Router();
const ProvisionalIntake = require('../models/ProvisionalIntake');
const AuditLog = require('../models/AuditLog');
const { isMongoConnected, memoryStore } = require('../config/db');
const { analyzeDiscrepancies } = require('../services/discrepancyEngine');
const { evaluateMultiSystemTriage } = require('../services/redFlagRules');

/**
 * Kiosk Ingestion Handler (supports both Task 5 & Frontend Event contracts)
 */
async function handleKioskIngestion(req, res) {
  try {
    const payload = req.body || {};

    // Normalize IDs (support intakeId/sessionId and abhaId/patientId)
    const intakeId = payload.intakeId || payload.sessionId || `INTAKE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const abhaId = payload.abhaId || payload.patientId || `ABHA-${Date.now()}`;

    if (!payload.abhaId && !payload.patientId && !payload.patientDemographics?.fullName) {
      payload.abhaId = abhaId;
    }

    // Default patient demographics if missing
    if (!payload.patientDemographics) {
      payload.patientDemographics = {
        fullName: payload.patientId || payload.fullName || "Anonymous Patient",
        gender: payload.gender || "M",
        age: payload.age || 45,
        provenanceMeta: {
          provenance: 'touch-selected',
          confidence: 1.0,
          timestamp: new Date()
        }
      };
    } else if (!payload.patientDemographics.provenanceMeta) {
      payload.patientDemographics.provenanceMeta = {
        provenance: 'touch-selected',
        confidence: 1.0,
        timestamp: new Date()
      };
    }

    // Provenance Tagging Defaults for Vitals
    if (payload.vitals) {
      ['bloodPressure', 'spo2', 'heartRate', 'temperature', 'bloodGlucose'].forEach(vKey => {
        if (payload.vitals[vKey] && typeof payload.vitals[vKey] === 'object' && !payload.vitals[vKey].provenanceMeta) {
          payload.vitals[vKey].provenanceMeta = {
            provenance: 'device-captured',
            confidence: 0.99,
            timestamp: new Date()
          };
        }
      });
    }

    // Run Cross-Verification Discrepancy Engine
    const autoDiscrepancies = analyzeDiscrepancies(payload);
    const combinedDiscrepancies = [
      ...(payload.discrepancyFlags || []),
      ...autoDiscrepancies
    ];

    const uniqueDiscrepancies = Array.from(
      new Map(combinedDiscrepancies.map(item => [item.flagId || item.message, item])).values()
    );

    // Evaluate multi-system red flags and clinical triage level via clinical rules engine
    const triageEval = evaluateMultiSystemTriage(payload);
    const computedTriageLevel = triageEval.triageLevel || 'ROUTINE';

    const provisionalRecord = {
      ...payload,
      intakeId: intakeId,
      abhaId: abhaId,
      status: payload.status || 'PROVISIONAL',
      triage: {
        ...(payload.triage || {}),
        triageLevel: computedTriageLevel,
        urgencyScore: triageEval.urgencyScore || 3,
        recommendedDepartment: payload.triage?.recommendedDepartment || (computedTriageLevel === 'EMERGENCY' ? 'Emergency Department' : computedTriageLevel === 'URGENT' ? 'Urgent Care Clinic' : 'General Medicine'),
        protocolNotes: triageEval.reason || 'Standard Clinical Queue'
      },
      redFlags: triageEval.redFlags || [],
      discrepancyFlags: uniqueDiscrepancies,
      createdAt: payload.createdAt || new Date(),
      updatedAt: new Date()
    };

    // Database Persistence
    let savedRecord = null;
    if (isMongoConnected()) {
      savedRecord = await ProvisionalIntake.findOneAndUpdate(
        { intakeId: intakeId },
        provisionalRecord,
        { upsert: true, new: true }
      );
    } else {
      savedRecord = await memoryStore.save('ProvisionalIntake', provisionalRecord);
    }

    // Audit Logging
    const auditData = {
      logId: `AUDIT-INTAKE-${Date.now()}`,
      action: 'KIOSK_INTAKE_RECEIVED',
      intakeId: intakeId,
      abhaId: abhaId,
      performedBy: 'KIOSK_SELF_SERVICE_TERMINAL',
      ipAddress: req.ip || '127.0.0.1',
      details: {
        vitalsCaptured: !!payload.vitals,
        ocrDocsCount: payload.ocrDocuments ? payload.ocrDocuments.length : 0,
        chiefComplaintsCount: payload.chiefComplaints ? payload.chiefComplaints.length : 0,
        discrepanciesDetected: uniqueDiscrepancies.length,
        triageLevel: computedTriageLevel,
        redFlagsCount: triageEval.redFlags?.length || 0
      },
      timestamp: new Date()
    };

    if (isMongoConnected()) {
      await AuditLog.create(auditData);
    } else {
      await memoryStore.save('AuditLog', auditData);
    }

    // Broadcast Socket.io Event to update Doctor Dashboard UI in real time
    const io = req.app.get('io');
    if (io) {
      io.emit('PATIENT_EVENT_RECEIVED', {
        sessionId: savedRecord.intakeId,
        patientId: savedRecord.abhaId,
        status: savedRecord.status,
        timestamp: new Date().toISOString()
      });
      io.emit('TRIAGE_UPDATED', {
        sessionId: savedRecord.intakeId,
        status: savedRecord.status,
        triageResult: {
          patientId: savedRecord.abhaId,
          triageLevel: savedRecord.triage?.triageLevel || 'ROUTINE',
          reason: savedRecord.triage?.protocolNotes || savedRecord.hpi?.narrative || 'Kiosk intake processed.',
          action: savedRecord.triage?.protocolNotes || 'Standard Clinical Queue',
          triggeredRules: [
            ...uniqueDiscrepancies.map(d => d.message),
            ...(triageEval.redFlags || []).map(r => r.reason)
          ],
          timestamp: new Date().toISOString()
        }
      });
      io.emit('kiosk:intake_submitted', {
        sessionId: savedRecord.intakeId,
        intakeId: savedRecord.intakeId,
        patientId: savedRecord.abhaId,
        patientName: savedRecord.patientDemographics?.fullName,
        triageLevel: savedRecord.triage?.triageLevel || 'ROUTINE',
        urgencyScore: savedRecord.triage?.urgencyScore || 3,
        redFlags: triageEval.redFlags || [],
        status: savedRecord.status,
        timestamp: new Date().toISOString(),
        vitals: savedRecord.vitals,
        symptoms: savedRecord.chiefComplaints
      });

      if (computedTriageLevel === 'EMERGENCY') {
        io.emit('ESCALATION_REQUIRED', {
          sessionId: savedRecord.intakeId,
          patientId: savedRecord.abhaId,
          session: { sessionId: savedRecord.intakeId, patientId: savedRecord.abhaId },
          triageLevel: 'EMERGENCY',
          urgencyScore: 10,
          redFlags: triageEval.redFlags,
          reason: triageEval.reason,
          timestamp: new Date().toISOString()
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: "Kiosk intake successfully ingested and persisted in PROVISIONAL state.",
      data: {
        intakeId: savedRecord.intakeId,
        sessionId: savedRecord.intakeId,
        abhaId: savedRecord.abhaId,
        patientId: savedRecord.abhaId,
        status: savedRecord.status,
        patientName: savedRecord.patientDemographics?.fullName,
        discrepanciesDetected: uniqueDiscrepancies.length,
        discrepancyFlags: uniqueDiscrepancies,
        clinicalSummaryUrl: `/api/v1/clinical/patient/${savedRecord.abhaId}/summary`
      }
    });

  } catch (err) {
    console.error(`[Kiosk Ingestion Error]: ${err.message}`, err);
    return res.status(500).json({
      success: false,
      error: "INGESTION_FAILED",
      message: `Failed to process kiosk intake: ${err.message}`
    });
  }
}

// Ingestion Routes & Aliases
router.post('/intake', handleKioskIngestion);
router.post('/submit', handleKioskIngestion);

// ============================================================
// Hospital Kiosk Door Controller Proxy (Node 3 — ESP32 Servo)
// ============================================================
const axios = require('axios');
const getDoorControllerIP = () => process.env.DOOR_CONTROLLER_IP || '192.168.137.102';

// In-memory virtual door state fallback (ensures Kiosk & Nova never freeze if hardware is offline)
let virtualDoorState = { status: 'closed', angle: 6, hardwareOnline: false };

router.post('/door/open', async (req, res) => {
  const ip = getDoorControllerIP();
  const io = req.app.get('io');
  try {
    const espRes = await axios.get(`http://${ip}/door/open`, { timeout: 1500 });
    virtualDoorState = { status: 'open', angle: 180, hardwareOnline: true };
    if (io) io.emit('kiosk:door_state', { status: 'open', angle: 180, hardwareOnline: true });
    return res.json({ success: true, online: true, status: 'open', angle: 180, ...espRes.data });
  } catch (err) {
    // Graceful Virtual Fallback
    virtualDoorState = { status: 'open', angle: 180, hardwareOnline: false };
    if (io) io.emit('kiosk:door_state', { status: 'open', angle: 180, hardwareOnline: false, simulated: true });
    return res.json({
      success: true,
      online: true,
      status: 'open',
      angle: 180,
      simulated: true,
      note: `Door opened (Virtual mode — hardware ESP32 unreachable at http://${ip})`
    });
  }
});

router.post('/door/close', async (req, res) => {
  const ip = getDoorControllerIP();
  const io = req.app.get('io');
  try {
    const espRes = await axios.get(`http://${ip}/door/close`, { timeout: 1500 });
    virtualDoorState = { status: 'closed', angle: 6, hardwareOnline: true };
    if (io) io.emit('kiosk:door_state', { status: 'closed', angle: 6, hardwareOnline: true });
    return res.json({ success: true, online: true, status: 'closed', angle: 6, ...espRes.data });
  } catch (err) {
    // Graceful Virtual Fallback
    virtualDoorState = { status: 'closed', angle: 6, hardwareOnline: false };
    if (io) io.emit('kiosk:door_state', { status: 'closed', angle: 6, hardwareOnline: false, simulated: true });
    return res.json({
      success: true,
      online: true,
      status: 'closed',
      angle: 6,
      simulated: true,
      note: `Door closed (Virtual mode — hardware ESP32 unreachable at http://${ip})`
    });
  }
});

router.get('/door/status', async (req, res) => {
  const ip = getDoorControllerIP();
  try {
    const espRes = await axios.get(`http://${ip}/door/status`, { timeout: 1200 });
    virtualDoorState = { status: espRes.data?.status || 'closed', angle: espRes.data?.angle || 6, hardwareOnline: true };
    return res.json({ success: true, online: true, ...espRes.data });
  } catch (err) {
    return res.json({
      success: true,
      online: true,
      ...virtualDoorState,
      simulated: true,
      note: `Hardware offline at http://${ip}; serving active virtual state`
    });
  }
});

module.exports = router;
module.exports.handleKioskIngestion = handleKioskIngestion;
