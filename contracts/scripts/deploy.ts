import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const factory = await ethers.getContractFactory("SignalLedger");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("SignalLedger deployed to:", address);

  const deployment = {
    address,
    deployer: deployer.address,
    network: (await ethers.provider.getNetwork()).name,
    timestamp: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outPath = path.join(outDir, "localhost.json");
  fs.writeFileSync(outPath, JSON.stringify(deployment, null, 2));
  console.log("Deployment info saved to:", outPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
