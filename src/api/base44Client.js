import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const isBrowser = typeof window !== 'undefined';

const createLocalBase44 = () => {
  const STORAGE_KEYS = {
    templates: 'daily_dash_task_templates',
    logs: 'daily_dash_daily_logs',
    user: 'daily_dash_user',
  };

  const safeParse = (value, fallback) => {
    if (!value) return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  const load = (key, fallback) => {
    if (!isBrowser) return fallback;
    return safeParse(window.localStorage.getItem(key), fallback);
  };

  const save = (key, value) => {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  };

  const nextId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  };

  const entities = {
    TaskTemplate: {
      async list() {
        const templates = load(STORAGE_KEYS.templates, []);
        return [...templates].sort((a, b) => (a.order || 0) - (b.order || 0));
      },
      async create(data) {
        const templates = load(STORAGE_KEYS.templates, []);
        const template = {
          id: nextId(),
          ...data,
        };
        templates.push(template);
        save(STORAGE_KEYS.templates, templates);
        return template;
      },
      async update(id, data) {
        const templates = load(STORAGE_KEYS.templates, []);
        const updated = templates.map((t) => (t.id === id ? { ...t, ...data } : t));
        save(STORAGE_KEYS.templates, updated);
        return updated.find((t) => t.id === id) || null;
      },
      async delete(id) {
        const templates = load(STORAGE_KEYS.templates, []);
        const filtered = templates.filter((t) => t.id !== id);
        save(STORAGE_KEYS.templates, filtered);
        return;
      },
    },
    DailyLog: {
      async list(orderBy, limit) {
        const logs = load(STORAGE_KEYS.logs, []);
        const sorted = [...logs].sort((a, b) => {
          if (orderBy === '-date') {
            return (b.date || '').localeCompare(a.date || '');
          }
          if (orderBy === 'date') {
            return (a.date || '').localeCompare(b.date || '');
          }
          return 0;
        });
        return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
      },
      async filter(query) {
        const logs = load(STORAGE_KEYS.logs, []);
        if (query && query.date) {
          return logs.filter((l) => l.date === query.date);
        }
        return logs;
      },
      async create(data) {
        const logs = load(STORAGE_KEYS.logs, []);
        const log = {
          id: nextId(),
          ...data,
        };
        logs.push(log);
        save(STORAGE_KEYS.logs, logs);
        return log;
      },
      async update(id, data) {
        const logs = load(STORAGE_KEYS.logs, []);
        const updated = logs.map((l) => (l.id === id ? { ...l, ...data } : l));
        save(STORAGE_KEYS.logs, updated);
        return updated.find((l) => l.id === id) || null;
      },
      async delete(id) {
        const logs = load(STORAGE_KEYS.logs, []);
        const filtered = logs.filter((l) => l.id !== id);
        save(STORAGE_KEYS.logs, filtered);
        return;
      },
    },
  };

  const auth = {
    async me() {
      let user = load(STORAGE_KEYS.user, null);
      if (!user) {
        user = { id: 'local-user', currency: 'USD' };
        save(STORAGE_KEYS.user, user);
      }
      return user;
    },
    async updateMe(patch) {
      const user = await auth.me();
      const updated = { ...user, ...patch };
      save(STORAGE_KEYS.user, updated);
      return updated;
    },
    logout() {
      // local mode: keep data, just no-op
    },
    redirectToLogin() {
      // local mode: no-op
    },
  };

  return { entities, auth };
};

export const base44 = (appId && appBaseUrl)
  ? createClient({
      appId,
      token,
      functionsVersion,
      serverUrl: '',
      requiresAuth: false,
      appBaseUrl,
    })
  : createLocalBase44();
