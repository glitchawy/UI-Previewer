export type DeploymentProfile = "customer";
export type PublicDeploymentProfile = DeploymentProfile | "unknown";

type DeploymentEnvironment = {
  DEPLOYMENT_PROFILE?: string;
};

export type RuntimeCapabilities = {
  deploymentProfile: PublicDeploymentProfile;
};

export function runtimeCapabilities(
  environment: DeploymentEnvironment = process.env,
): RuntimeCapabilities {
  const rawProfile = environment.DEPLOYMENT_PROFILE;
  const deploymentProfile: PublicDeploymentProfile =
    rawProfile === "customer" ? rawProfile : "unknown";
  return { deploymentProfile };
}

export function assertSafeDeploymentConfiguration(
  environment: DeploymentEnvironment = process.env,
): void {
  if (environment.DEPLOYMENT_PROFILE && environment.DEPLOYMENT_PROFILE !== "customer") {
    throw new Error("Unsupported deployment profile; use DEPLOYMENT_PROFILE=customer.");
  }
}