'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import { supabase } from '@/lib/db/supabase/client';
import { useMissionControl } from '@/lib/store';
import { subscribeHeartbeats, getAgentStatus, getAgentStatusLabel } from '@/lib/dispatch';
import type { Agent, AgentStatus, OpenClawSession } from '@/lib/types';
import { AgentModal } from './AgentModal';
import { DiscoverAgentsModal } from './DiscoverAgentsModal';

type FilterTab = 'all' | 'working' | 'standby';

interface Checkpoint {
  id: string;
  agent_id: string;
  status: string;
  summary?: string;
  updated_at: string;
}

interface Heartbeat {
  agent_id: string;
  last_seen_at: string | null;
  gateway_version?: string;
  metadata?: Record<string, any>;
}

interface SubAgentSession {
  id: string;
  parent_agent_id: string;
  agent_name: string | null;
  status: string;
  openclaw_session_id: string;
  metadata?: Record<string, any>;
}

interface AgentsSidebarProps {
  workspaceId?: string;
  mobileMode?: boolean;
  isPortrait?: boolean;
}

export function AgentsSidebar({ workspaceId, mobileMode = false, isPortrait = true }: AgentsSidebarProps) {
  const { agents, selectedAgent, setSelectedAgent, agentOpenClawSessions, setAgentOpenClawSession } = useMissionControl();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [activeSubAgents, setActiveSubAgents] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [checkpoints, setCheckpoints] = useState<Record<string, Checkpoint>>({});
  const [heartbeats, setHeartbeats] = useState<Record<string, Heartbeat>>({});
  const [subAgentSessions, setSubAgentSessions] = useState<SubAgentSession[]>([]);

  const effectiveMinimized = mobileMode ? false : isMinimized;
  const toggleMinimize = () => setIsMinimized(!isMinimized);
  const isDispatchEnabled = process.env.NEXT_PUBLIC_SUPABASE_AGENT_DISPATCH === 'true';

  const loadOpenClawSessions = useCallback(async () => {
    for (const agent of agents) {
      try {
        const res = await fetch(`/api/agents/${agent.id}/openclaw`);
        if (res.ok) {
          const data = await res.json();
          if (data.linked && data.session) {
            setAgentOpenClawSession(agent.id, data.session as OpenClawSession);
          }
        }
      } catch (error) {
        console.error(`Failed to load OpenClaw session for ${agent.name}:`, error);
      }
    }
  }, [agents, setAgentOpenClawSession]);

  useEffect(() => {
    if (agents.length > 0) {
      loadOpenClawSessions();
    }
  }, [loadOpenClawSessions, agents.length]);

  useEffect(() => {
    const loadSubAgentSessions = async () => {
      try {
        const res = await fetch('/api/openclaw/sessions');
        if (res.ok) {
          const sessions: SubAgentSession[] = await res.json();
          setSubAgentSessions(sessions);
          setActiveSubAgents(sessions.length);
        }
      } catch (error) {
        console.error('Failed to load sub-agent sessions:', error);
      }
    };

    loadSubAgentSessions();
    const interval = setInterval(loadSubAgentSessions, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Only load/subscribe to checkpoints if in Supabase mode
    if (process.env.NEXT_PUBLIC_DATABASE_PROVIDER !== 'supabase') {
      return;
    }

    const loadCheckpoints = async () => {
      try {
        const url = workspaceId
          ? `/api/checkpoints?status=active&workspace_id=${workspaceId}`
          : '/api/checkpoints?status=active&workspace_id=default';
        const res = await fetch(url);
        if (res.ok) {
          const data: Checkpoint[] = await res.json();
          const map: Record<string, Checkpoint> = {};
          for (const cp of data) {
            map[cp.agent_id] = cp;
          }
          setCheckpoints(map);
        }
      } catch (error) {
        console.error('Failed to load checkpoints:', error);
      }
    };

    // Initial load
    loadCheckpoints();

    // Subscribe to checkpoint changes via Realtime
    const channel = supabase
      .channel('checkpoints-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'checkpoints' },
        () => {
          // Reload checkpoints on any change (INSERT, UPDATE, DELETE)
          loadCheckpoints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  useEffect(() => {
    // Only load/subscribe to heartbeats if in Supabase mode
    if (process.env.NEXT_PUBLIC_DATABASE_PROVIDER !== 'supabase') {
      return;
    }

    // Initial load of existing heartbeats
    const loadHeartbeats = async () => {
      try {
        const url = workspaceId 
          ? `/api/heartbeats?workspace_id=${workspaceId}`
          : '/api/heartbeats?workspace_id=default';
        const res = await fetch(url);
        if (res.ok) {
          const data: Heartbeat[] = await res.json();
          const map: Record<string, Heartbeat> = {};
          for (const hb of data) {
            map[hb.agent_id] = hb;
          }
          setHeartbeats(map);
        }
      } catch (error) {
        console.error('Failed to load heartbeats:', error);
      }
    };

    loadHeartbeats();

    // Poll every 30 seconds
    const interval = setInterval(loadHeartbeats, 30_000);

    // Subscribe to agent heartbeats for live updates
    const unsubscribe = subscribeHeartbeats((agentId, row) => {
      setHeartbeats((prev) => ({
        ...prev,
        [agentId]: row,
      }));
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [workspaceId]);

  const filteredAgents = agents.filter((agent) => {
    if (filter === 'all') return true;
    return agent.status === filter;
  });

  const getStatusBadge = (status: AgentStatus) => {
    const styles = {
      standby: 'status-standby',
      working: 'status-working',
      offline: 'status-offline',
    };
    return styles[status] || styles.standby;
  };

  return (
    <aside
      className={`bg-mc-bg-secondary ${mobileMode ? 'border border-mc-border rounded-lg h-full' : 'border-r border-mc-border'} flex flex-col transition-all duration-300 ease-in-out ${
        effectiveMinimized ? 'w-12' : mobileMode ? 'w-full' : 'w-64'
      }`}
    >
      <div className="p-3 border-b border-mc-border">
        <div className="flex items-center">
          {!mobileMode && (
            <button
              onClick={toggleMinimize}
              className="p-1 rounded hover:bg-mc-bg-tertiary text-mc-text-secondary hover:text-mc-text transition-colors"
              aria-label={effectiveMinimized ? 'Expand agents' : 'Minimize agents'}
            >
              {effectiveMinimized ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
          {!effectiveMinimized && (
            <>
              <span className="text-sm font-medium uppercase tracking-wider">Agents</span>
              <span className="bg-mc-bg-tertiary text-mc-text-secondary text-xs px-2 py-0.5 rounded ml-2">{agents.length}</span>
            </>
          )}
        </div>

        {!effectiveMinimized && (
          <>
            {activeSubAgents > 0 && (
              <div className="mb-3 mt-3 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-400">●</span>
                  <span className="text-mc-text">Active Sub-Agents:</span>
                  <span className="font-bold text-green-400">{activeSubAgents}</span>
                </div>
              </div>
            )}

            <div className={`mt-3 ${mobileMode && isPortrait ? 'grid grid-cols-3 gap-2' : 'flex gap-1'}`}>
              {(['all', 'working', 'standby'] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`min-h-11 text-xs rounded uppercase ${mobileMode && isPortrait ? 'px-1' : 'px-3'} ${
                    filter === tab ? 'bg-mc-accent text-mc-bg font-medium' : 'text-mc-text-secondary hover:bg-mc-bg-tertiary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredAgents.map((agent) => {
          const openclawSession = agentOpenClawSessions[agent.id];

          if (effectiveMinimized) {
            return (
              <div key={agent.id} className="flex justify-center py-3">
                <button
                  onClick={() => {
                    setSelectedAgent(agent);
                    setEditingAgent(agent);
                  }}
                  className="relative group"
                  title={`${agent.name} - ${agent.role}`}
                >
                  <span className="text-2xl">{agent.avatar_emoji}</span>
                  {openclawSession && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-mc-bg-secondary" />}
                  {!!agent.is_master && <span className="absolute -top-1 -right-1 text-xs text-mc-accent-yellow">★</span>}
                  <span
                    className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                      agent.status === 'working' ? 'bg-mc-accent-green' : agent.status === 'standby' ? 'bg-mc-text-secondary' : 'bg-gray-500'
                    }`}
                  />
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-mc-bg text-mc-text text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-mc-border">
                    {agent.name}
                  </div>
                </button>
              </div>
            );
          }

          return (
            <div key={agent.id} className={`w-full rounded hover:bg-mc-bg-tertiary transition-colors ${selectedAgent?.id === agent.id ? 'bg-mc-bg-tertiary' : ''}`}>
              <button
                onClick={() => {
                  setSelectedAgent(agent);
                  setEditingAgent(agent);
                }}
                className="w-full flex items-center gap-3 p-3 text-left min-h-11"
              >
                <div className="text-2xl relative">
                  {agent.avatar_emoji}
                  {openclawSession && <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-mc-bg-secondary" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{agent.name}</span>
                    {!!agent.is_master && <span className="text-xs text-mc-accent-yellow">★</span>}
                  </div>
                  <div className="text-xs text-mc-text-secondary truncate flex items-center gap-1">
                    {agent.role}
                    {agent.source === 'gateway' && (
                      <span className="text-[10px] px-1 py-0 bg-blue-500/20 text-blue-400 rounded" title="Imported from Gateway">
                        GW
                      </span>
                    )}
                  </div>
                  {checkpoints[agent.id]?.summary && (
                    <div className="text-xs text-mc-text-secondary truncate italic mt-0.5">
                      {checkpoints[agent.id].summary}
                    </div>
                  )}
                  
                  {/* Sub-agent session dots — row below card content */}
                  {(() => {
                    const agentSessions = subAgentSessions.filter(s => s.parent_agent_id === agent.id);
                    if (agentSessions.length === 0) return null;
                    return (
                      <div className="flex gap-1 mt-2">
                        {agentSessions.map((s) => (
                          <span
                            key={s.id}
                            title={s.metadata?.instructions || s.openclaw_session_id}
                            className="inline-block w-2 h-2 rounded-full bg-green-500"
                          />
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {process.env.NEXT_PUBLIC_DATABASE_PROVIDER === 'supabase' && (() => {
                  const heartbeat = heartbeats[agent.id];
                  const heartbeatStatus = getAgentStatus(heartbeat?.last_seen_at || null);
                  const statusLabel = getAgentStatusLabel(heartbeatStatus);
                  const badgeClasses = heartbeatStatus === 'online' ? 'bg-green-500/20 text-green-400' : 
                                      heartbeatStatus === 'stale' ? 'bg-yellow-500/20 text-yellow-400' : 
                                      'bg-red-500/20 text-red-400';
                  return (
                    <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${badgeClasses}`}>
                      <span>{statusLabel.emoji}</span>
                      <span className="uppercase">{statusLabel.text}</span>
                    </span>
                  );
                })()}
              </button>


            </div>
          );
        })}
      </div>

      {!effectiveMinimized && (
        <div className="p-3 border-t border-mc-border space-y-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full min-h-11 flex items-center justify-center gap-2 px-3 bg-mc-bg-tertiary hover:bg-mc-border rounded text-sm text-mc-text-secondary hover:text-mc-text transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Agent
          </button>
          <button
            onClick={() => setShowDiscoverModal(true)}
            className="w-full min-h-11 flex items-center justify-center gap-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Search className="w-4 h-4" />
            Import from Gateway
          </button>
        </div>
      )}

      {showCreateModal && <AgentModal onClose={() => setShowCreateModal(false)} workspaceId={workspaceId} />}
      {editingAgent && <AgentModal agent={editingAgent} onClose={() => setEditingAgent(null)} workspaceId={workspaceId} />}
      {showDiscoverModal && <DiscoverAgentsModal onClose={() => setShowDiscoverModal(false)} workspaceId={workspaceId} />}
    </aside>
  );
}
