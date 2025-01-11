import { create } from 'zustand';

const useSSHStore = create((set) => ({
  sessions: {},
  addSession: (terminalId, session) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [terminalId]: session,
      },
    })),
  getSession: (terminalId) => {
    return useSSHStore.getState().sessions[terminalId];
  },
  removeSession: (terminalId) =>
    set((state) => {
      const { [terminalId]: _, ...rest } = state.sessions;
      return { sessions: rest };
    }),
  clearAll: () => {
    // 清理所有terminal
    Object.values(useSSHStore.getState().sessions).forEach((session) => {
      session?.destroy();
    });
    set({ sessions: {} });
  },
}));

// 监听页面刷新和关闭事件
if (typeof window !== 'undefined') {
  const cleanup = () => {
    useSSHStore.getState().clearAll();
  };

  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
}

export default useSSHStore;
