'use client';

import { useEffect, useState } from 'react';
import { Circle } from 'lucide-react';

interface SubAgentSession {
  id: string;
  openclaw_session_id: string;
  agent_name: string | null;
  agent_avatar_emoji: string | null;
  parent_agent_name: string | null;
  task_id: string | null;
  status: string;
  created_at: string;
}

export function ActiveJobsPanel() {
  const [sessions, setSessions] = useState<SubAgentSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/openclaw/sessions');
        if (res.ok) setSessions(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;
  if (sessions.length === 0) return null;

  return (
    <div className="mc-card p-4">
      <h3 className="text-sm font-semibold text-mc-text-secondary uppercase tracking-wide mb-3">
        Active Jobs
      </h3>
      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.id} className="flex items-center gap-2 text-sm">
            <Circle className="w-2 h-2 text-green-500 fill-current animate-pulse flex-shrink-0" />
            <span className="text-mc-text">
              {s.agent_avatar_emoji} {s.agent_name || 'Sub-Agent'}
            </span>
            {s.parent_agent_name && (
              <span className="text-mc-text-secondary text-xs">
                via {s.parent_agent_name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
