import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ShieldCheck, Activity, User, BarChart2, Radio, Zap, ShieldAlert,
  AlertOctagon, RefreshCw, Lock, AlertTriangle, Cpu, Layers, TrendingUp,
  UserX, ShieldOff, Eye
} from 'lucide-react';

const DashboardPlaceholder = () => {
  const { user } = useAuth();
  
  // Dashboard & Telemetry States
  const [dashboardData, setDashboardData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [riskEval, setRiskEval] = useState(null);
  const [kafkaData, setKafkaData] = useState(null);
  const [blockedEntities, setBlockedEntities] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);

  // Simulator States
  const [attackLogs, setAttackLogs] = useState([]);
  const [isSimulatingBot, setIsSimulatingBot] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, logsRes, riskRes, kafkaRes, blockedRes] = await Promise.all([
        api.get('/analytics/dashboard-metrics'),
        api.get('/analytics/requests?limit=10'),
        api.get('/analytics/risk-eval'),
        api.get('/analytics/kafka-events'),
        api.get('/analytics/blocked-entities'),
      ]);

      setDashboardData(dashRes.data.data || null);
      setLogs(logsRes.data.data.logs || []);
      setRiskEval(riskRes.data.data || null);
      setKafkaData(kafkaRes.data.data || null);
      setBlockedEntities(blockedRes.data.data.blocked || []);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 5 seconds if enabled
    let interval = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchDashboardData();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const simulateBotAbuseAttack = async () => {
    setIsSimulatingBot(true);
    setAttackLogs([]);
    const results = [];

    // Step A: Fire rapid registrations (Trigger rate limit -> +30 risk points)
    for (let i = 1; i <= 6; i++) {
      try {
        const res = await api.post('/auth/register', {
          name: `Abuse Bot #${i}`,
          email: `dashboard_attack_${Date.now()}_${i}@bot.com`,
          password: 'BotPassword123!',
        });
        results.push({ call: i, type: 'Registration Burst', status: res.status, msg: 'Allowed' });
      } catch (err) {
        results.push({
          call: i,
          type: 'Registration Burst',
          status: err.response?.status || 500,
          msg: err.response?.data?.message || 'Rate Limit Breached (HTTP 429)',
        });
      }
    }

    // Step B: Send 2 failed login attempts (+20 risk points)
    for (let j = 1; j <= 2; j++) {
      try {
        await api.post('/auth/login', { email: 'fake@bot.com', password: 'WrongPassword!' });
      } catch (err) {
        results.push({
          call: 6 + j,
          type: 'Failed Login Burst',
          status: err.response?.status || 401,
          msg: 'Failed Login (HTTP 401)',
        });
      }
    }

    // Step C: Test blocked request after reaching High Risk (Score >= 80)
    try {
      const res = await api.get('/users/me');
      results.push({ call: 9, type: 'Blocked Check', status: res.status, msg: 'Call Passed' });
    } catch (err) {
      if (err.response && err.response.status === 403) {
        results.push({
          call: 9,
          type: 'Block Guard Intercept',
          status: 403,
          msg: 'BLOCKED BY REDIS BLOCKGUARD! HTTP 403 Forbidden',
        });
      } else {
        results.push({
          call: 9,
          type: 'Blocked Check',
          status: err.response?.status || 500,
          msg: err.response?.data?.message || err.message,
        });
      }
    }

    setAttackLogs(results);
    setIsSimulatingBot(false);
    fetchDashboardData();
  };

  const getStatusBadge = (code) => {
    if (code >= 200 && code < 300) {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-950 text-emerald-400 border border-emerald-800">{code} OK</span>;
    }
    if (code === 403) {
      return <span className="px-2 py-0.5 text-xs font-bold rounded bg-purple-950 text-purple-300 border border-purple-800 animate-pulse">403 BLOCKED</span>;
    }
    if (code === 429) {
      return <span className="px-2 py-0.5 text-xs font-bold rounded bg-rose-950 text-rose-400 border border-rose-800">429 LIMIT</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-950 text-amber-400 border border-amber-800">{code} Err</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-cyan-950/60 border border-slate-700 rounded-2xl p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <ShieldCheck className="h-9 w-9 text-cyan-400" />
            <h1 className="text-3xl font-extrabold text-white">Intelligent API Protection Platform</h1>
          </div>
          <p className="text-slate-400 text-sm max-w-3xl">
            Real-Time Analytics & Security Console monitoring API request throughput (RPM), Redis rate-limit throttling, behavioral risk scoring, and Kafka event streaming.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center space-x-2 ${
              autoRefresh
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800 hover:bg-emerald-900'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>{autoRefresh ? 'Auto-Refresh (5s Live)' : 'Auto-Refresh Paused'}</span>
          </button>
          <button
            onClick={fetchDashboardData}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs py-2 px-4 rounded-xl transition shadow"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* 6 Core KPI Metrics Cards (Mandatory Phase 7 Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
        {/* 1. Total API Requests */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Requests</span>
            <BarChart2 className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{dashboardData?.totalRequests || 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">SQL Telemetry Logged</p>
        </div>

        {/* 2. Requests Per Minute (RPM) */}
        <div className="bg-slate-800 border border-emerald-900/60 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase">Requests / Min (RPM)</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">{dashboardData?.requestsPerMinute || 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Past 60 Seconds</p>
        </div>

        {/* 3. Rate-Limit Violations */}
        <div className="bg-slate-800 border border-rose-900/60 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-400 uppercase">Rate-Limit Violations</span>
            <AlertOctagon className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold text-rose-400">{dashboardData?.rateLimitViolations || 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">HTTP 429 Throttle Count</p>
        </div>

        {/* 4. Suspicious Activity Count */}
        <div className="bg-slate-800 border border-amber-900/60 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-400 uppercase">Suspicious Count</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400">{dashboardData?.suspiciousActivityCount || 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Risk Score 50–79</p>
        </div>

        {/* 5. Blocked IP Addresses */}
        <div className="bg-slate-800 border border-purple-900/60 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-400 uppercase">Blocked IPs</span>
            <Lock className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-purple-400">{dashboardData?.blockedIpCount || 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Redis Temporary Blocks</p>
        </div>

        {/* 6. Failed Login Attempts */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Failed Logins</span>
            <UserX className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-100">{dashboardData?.failedLoginAttempts || 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">HTTP 401 Attempts</p>
        </div>
      </div>

      {/* Grid: Top Suspicious IPs & Security Audit Events Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Suspicious IP Addresses Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
              <h3 className="text-base font-bold text-white">Top Suspicious IP Addresses</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Ranked Telemetry</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 font-mono">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Client IP Address</th>
                  <th className="py-2.5 px-3">Total Calls</th>
                  <th className="py-2.5 px-3">Violations</th>
                  <th className="py-2.5 px-3">Failed Logins</th>
                  <th className="py-2.5 px-3">Block Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {dashboardData?.topSuspiciousIPs?.length > 0 ? (
                  dashboardData.topSuspiciousIPs.map((ip) => (
                    <tr key={ip.ipAddress} className="hover:bg-slate-750/50 transition">
                      <td className="py-2.5 px-3 font-bold text-cyan-300">{ip.ipAddress}</td>
                      <td className="py-2.5 px-3">{ip.totalRequests}</td>
                      <td className="py-2.5 px-3 text-rose-400 font-bold">{ip.violations}</td>
                      <td className="py-2.5 px-3 text-amber-400">{ip.failedLogins}</td>
                      <td className="py-2.5 px-3">
                        {ip.isBlocked ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                            BLOCKED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-500">No suspicious IPs recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Events Audit Log Feed */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Recent Security Audit Events</h3>
            </div>
            <span className="text-xs bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-mono">SQL Audit Trail</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {dashboardData?.securityEvents?.length > 0 ? (
              dashboardData.securityEvents.map((evt) => (
                <div key={evt.id} className="bg-slate-900 border border-slate-700/60 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      evt.eventType === 'ENTITY_BLOCKED' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {evt.eventType}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 font-mono">Target: <span className="text-cyan-300 font-bold">{evt.entityValue}</span> (Risk Score: <span className="text-rose-400 font-bold">{evt.riskScore}</span>)</p>
                  {evt.details && (
                    <p className="text-[11px] text-slate-400 font-sans truncate">{evt.details}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-xs py-8 text-center">No security audit events recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Kafka Event Stream & Interactive Simulator Panel */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-cyan-950/40 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Layers className="h-6 w-6 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Interactive Attack Simulator & Event Stream Console</h2>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Trigger multi-signal bot attacks to test Redis rate limiting, Behavioral Risk scoring, and Kafka event dispatches live.
            </p>
          </div>
          <button
            onClick={simulateBotAbuseAttack}
            disabled={isSimulatingBot}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition shadow-lg shadow-cyan-950/60 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Zap className="h-4 w-4" />
            <span>{isSimulatingBot ? 'Simulating Attack...' : 'Trigger Multi-Signal Attack'}</span>
          </button>
        </div>

        {/* Attack Simulator Log Output */}
        {attackLogs.length > 0 && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">Burst Call Execution Log</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {attackLogs.map((item) => (
                <div
                  key={item.call}
                  className={`p-3 rounded-lg border text-xs font-mono flex flex-col justify-between ${
                    item.status === 403
                      ? 'bg-purple-950 border-purple-700 text-purple-200'
                      : item.status === 429
                      ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">Step #{item.call}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 403 ? 'bg-purple-800 text-white' : item.status === 429 ? 'bg-rose-900 text-rose-200' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold">{item.type}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{item.msg}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Live Request Telemetry Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Live Request & Telemetry Stream</h3>
          </div>
          <button onClick={fetchDashboardData} className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Feed</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Client IP</th>
                <th className="py-3 px-4">Method & Endpoint</th>
                <th className="py-3 px-4">HTTP Status</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">User Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className={log.statusCode === 403 ? 'bg-purple-950/40 hover:bg-purple-900/40 transition' : log.statusCode === 429 ? 'bg-rose-950/30 hover:bg-rose-900/40 transition' : 'hover:bg-slate-750/50 transition'}>
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-cyan-300 font-semibold">
                      {log.ipAddress}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-xs bg-slate-900 px-2 py-0.5 rounded text-slate-200 mr-2">
                        {log.method}
                      </span>
                      <span className="font-mono text-xs text-slate-300">{log.endpoint}</span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(log.statusCode)}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-300">{log.responseTimeMs} ms</td>
                    <td className="py-3 px-4">
                      {log.userId ? (
                        <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800/80 px-2 py-0.5 rounded font-medium">
                          {log.userId.name || log.userId._id}
                        </span>
                      ) : (
                        <span className="text-xs bg-slate-900 text-slate-500 px-2 py-0.5 rounded">
                          Anonymous
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 text-sm">
                    Loading request telemetry stream...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPlaceholder;
