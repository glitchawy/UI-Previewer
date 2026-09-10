export type DeploymentProfile = "test" | "customer";
export type PublicDeploymentProfile = DeploymentProfile | "unknown";

type DeploymentEnvironment = {
  DEPLOYMENT_PROFILE?: string;
  MOCK_AUTH_ENABLED?: string;
  PUBLIC_TEST_MODE_ENABLED?: string;
};

export type RuntimeCapabilities = {
  deploymentProfile: PublicDeploymentProfile;
  publicTestLoginEnabled: boolean;
};

export function runtimeCapabilities(
  environment: DeploymentEnvironment = process.env,
): RuntimeCapabilities {
  const rawProfile = environment.DEPLOYMENT_PROFILE;
  const deploymentProfile: PublicDeploymentProfile =
    rawProfile === "test" || rawProfile === "customer" ? rawProfile : "unknown";
  const publicTestLoginEnabled =
    deploymentProfile === "test" &&
    environment.MOCK_AUTH_ENABLED === "true" &&
    environment.PUBLIC_TEST_MODE_ENABLED === "true";

  return { deploymentProfile, publicTestLoginEnabled };
}

export function assertSafeDeploymentConfiguration(
  environment: DeploymentEnvironment = process.env,
): void {
  if (
    environment.DEPLOYMENT_PROFILE === "customer" &&
    (environment.MOCK_AUTH_ENABLED === "true" ||
      environment.PUBLIC_TEST_MODE_ENABLED === "true")
  ) {
    throw new Error(
      "Unsafe customer deployment: remove MOCK_AUTH_ENABLED and PUBLIC_TEST_MODE_ENABLED when DEPLOYMENT_PROFILE=customer.",
    );
  }
}