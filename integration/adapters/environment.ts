export type EnvironmentConfig = ReturnType<typeof environmentConfig>;

export const environmentConfig = () => {
  const envVars = { public: new Map<string, string>(), private: new Map<string, string>() };

  const self = {
    setEnvVariable: (type: keyof typeof envVars, name: string, value: string) => {
      envVars[type].set(name, value);
      return self;
    },
    get publicVariables() {
      return [...envVars.public];
    },
    get privateVariables() {
      return [...envVars.private];
    },
    clone: () => {
      const res = environmentConfig();
      envVars.private.forEach((v, k) => res.setEnvVariable('private', k, v));
      envVars.public.forEach((v, k) => res.setEnvVariable('public', k, v));
      return res;
    },
  };

  return self;
};
