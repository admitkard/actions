export const globalStateFactory = (initialState: Record<string, any> = {}) => {
  let state: Record<string, any> = initialState;
  function set(subState: Record<string, any>): void;
  function set(key: string, value: any): void;
  function set(key, value?) {
    if (typeof key === 'string') {
      state[key] = value;
    } else if (typeof key === 'object') {
      state = { ...state, ...key };
    }
  }
  const get = <T extends any = any>(key: string) => {
    return state[key] as T;
  }
  const reset = (key: string) => {
    delete state[key];
  };

  return {
    set,
    get,
    reset,
  };
};

export const globalState = globalStateFactory({
  passed: true,
  failureReason: new Set<string>(),
  hints: new Set<string>(),
});
