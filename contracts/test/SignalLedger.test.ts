import { expect } from "chai";
import { ethers } from "hardhat";
import { SignalLedger } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("SignalLedger", function () {
  let contract: SignalLedger;
  let admin: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  const INITIAL_CREDITS = 1000n;
  const BPS = 10_000n;
  const VIRTUAL_LIQUIDITY = 100n;
  const ACTIVATION_THRESHOLD = 500n;

  beforeEach(async function () {
    [admin, alice, bob] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("SignalLedger");
    contract = await factory.deploy();
  });

  // Helper: register user + admin creates the library market
  async function setupMarket() {
    await contract.connect(alice).register();
    await contract.connect(bob).register();
    await contract.createMarket(
      "Will library occupancy exceed 85% between 8-10 PM?",
      "Mugar Library",
      "occupancy_pct",
      85,
      1700000000,
      1700007200,
      "synthetic"
    );
  }

  // ---------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------

  describe("Registration", function () {
    it("registers a new user with initial credits", async function () {
      await expect(contract.connect(alice).register())
        .to.emit(contract, "UserRegistered")
        .withArgs(alice.address);

      expect(await contract.registered(alice.address)).to.be.true;
      expect(await contract.getUserBalance(alice.address)).to.equal(
        INITIAL_CREDITS
      );
    });

    it("rejects duplicate registration", async function () {
      await contract.connect(alice).register();
      await expect(
        contract.connect(alice).register()
      ).to.be.revertedWith("already registered");
    });
  });

  // ---------------------------------------------------------------
  // Market creation
  // ---------------------------------------------------------------

  describe("Market creation", function () {
    it("allows admin to create a market", async function () {
      await expect(
        contract.createMarket(
          "Will library occupancy exceed 85% between 8-10 PM?",
          "Mugar Library",
          "occupancy_pct",
          85,
          1700000000,
          1700007200,
          "synthetic"
        )
      )
        .to.emit(contract, "MarketCreated")
        .withArgs(0);

      const m = await contract.getMarket(0);
      expect(m.question).to.equal(
        "Will library occupancy exceed 85% between 8-10 PM?"
      );
      expect(m.locationName).to.equal("Mugar Library");
      expect(m.threshold).to.equal(85);
      expect(m.status).to.equal(0); // Open
      expect(m.winningOutcome).to.equal(0); // None
    });

    it("rejects non-admin market creation", async function () {
      await expect(
        contract
          .connect(alice)
          .createMarket("q", "loc", "met", 50, 0, 1, "src")
      ).to.be.revertedWith("only admin");
    });
  });

  // ---------------------------------------------------------------
  // Trading
  // ---------------------------------------------------------------

  describe("Trading", function () {
    beforeEach(setupMarket);

    it("allows buying YES shares", async function () {
      const tx = contract.connect(alice).buyYes(0, 10);
      await expect(tx).to.emit(contract, "TradePlaced");

      const pos = await contract.getUserPosition(alice.address, 0);
      expect(pos.yes).to.equal(10);
      expect(pos.no).to.equal(0);
    });

    it("allows buying NO shares", async function () {
      const tx = contract.connect(bob).buyNo(0, 10);
      await expect(tx).to.emit(contract, "TradePlaced");

      const pos = await contract.getUserPosition(bob.address, 0);
      expect(pos.yes).to.equal(0);
      expect(pos.no).to.equal(10);
    });

    it("deducts credits on purchase", async function () {
      const balBefore = await contract.getUserBalance(alice.address);
      await contract.connect(alice).buyYes(0, 10);
      const balAfter = await contract.getUserBalance(alice.address);
      expect(balAfter).to.be.lt(balBefore);
    });

    it("updates prices after trades", async function () {
      const [yBefore] = await contract.getCurrentPrices(0);
      expect(yBefore).to.equal(5000n); // 50 / 50 initially

      await contract.connect(alice).buyYes(0, 50);
      const [yAfter] = await contract.getCurrentPrices(0);
      expect(yAfter).to.be.gt(yBefore);
    });

    it("rejects trade from unregistered user", async function () {
      const [, , stranger] = await ethers.getSigners();
      // stranger is admin in our setup, use a fresh signer
      const signers = await ethers.getSigners();
      const unreg = signers[3];
      await expect(
        contract.connect(unreg).buyYes(0, 1)
      ).to.be.revertedWith("not registered");
    });

    it("rejects trade with insufficient credits", async function () {
      // Alice has 1000 credits. Buy enough to drain them.
      // At initial 50% price, cost ≈ shares * 5000 / 10000 = shares/2 rounded up.
      // 2001 shares at ~50% → cost > 1000
      await expect(
        contract.connect(alice).buyYes(0, 2001)
      ).to.be.revertedWith("insufficient credits");
    });

    it("rejects buying zero shares", async function () {
      await expect(
        contract.connect(alice).buyYes(0, 0)
      ).to.be.revertedWith("zero shares");
    });
  });

  // ---------------------------------------------------------------
  // Settlement
  // ---------------------------------------------------------------

  describe("Settlement", function () {
    beforeEach(setupMarket);

    it("settles YES when actualValue >= threshold", async function () {
      await contract.connect(alice).buyYes(0, 10);

      await expect(contract.settleMarket(0, 90))
        .to.emit(contract, "MarketSettled")
        .withArgs(0, 90, 1); // Outcome.Yes = 1

      const m = await contract.getMarket(0);
      expect(m.status).to.equal(1); // Settled
      expect(m.winningOutcome).to.equal(1); // Yes
      expect(m.actualValue).to.equal(90);
    });

    it("settles NO when actualValue < threshold", async function () {
      await contract.connect(bob).buyNo(0, 10);

      await expect(contract.settleMarket(0, 80))
        .to.emit(contract, "MarketSettled")
        .withArgs(0, 80, 2); // Outcome.No = 2

      const m = await contract.getMarket(0);
      expect(m.winningOutcome).to.equal(2); // No
    });

    it("rejects non-admin settlement", async function () {
      await expect(
        contract.connect(alice).settleMarket(0, 90)
      ).to.be.revertedWith("only admin");
    });

    it("rejects settling an already settled market", async function () {
      await contract.settleMarket(0, 90);
      await expect(contract.settleMarket(0, 80)).to.be.revertedWith(
        "market not open"
      );
    });
  });

  // ---------------------------------------------------------------
  // Redemption
  // ---------------------------------------------------------------

  describe("Redemption", function () {
    beforeEach(async function () {
      await setupMarket();
      await contract.connect(alice).buyYes(0, 10);
      await contract.connect(bob).buyNo(0, 10);
    });

    it("pays out winning YES shares", async function () {
      await contract.settleMarket(0, 90); // YES wins

      const balBefore = await contract.getUserBalance(alice.address);
      await expect(contract.connect(alice).redeem(0))
        .to.emit(contract, "Redeemed")
        .withArgs(alice.address, 0, 10);

      const balAfter = await contract.getUserBalance(alice.address);
      expect(balAfter).to.equal(balBefore + 10n);
    });

    it("pays zero for losing NO shares when YES wins", async function () {
      await contract.settleMarket(0, 90); // YES wins

      await expect(contract.connect(bob).redeem(0))
        .to.emit(contract, "Redeemed")
        .withArgs(bob.address, 0, 0);
    });

    it("pays out winning NO shares", async function () {
      await contract.settleMarket(0, 80); // NO wins

      const balBefore = await contract.getUserBalance(bob.address);
      await expect(contract.connect(bob).redeem(0))
        .to.emit(contract, "Redeemed")
        .withArgs(bob.address, 0, 10);

      const balAfter = await contract.getUserBalance(bob.address);
      expect(balAfter).to.equal(balBefore + 10n);
    });

    it("rejects double redemption", async function () {
      await contract.settleMarket(0, 90);
      await contract.connect(alice).redeem(0);

      await expect(
        contract.connect(alice).redeem(0)
      ).to.be.revertedWith("already redeemed");
    });

    it("rejects redemption on unsettled market", async function () {
      await expect(
        contract.connect(alice).redeem(0)
      ).to.be.revertedWith("not settled");
    });
  });

  // ---------------------------------------------------------------
  // Market activation staking
  // ---------------------------------------------------------------

  describe("Market activation staking", function () {
    beforeEach(async function () {
      await contract.connect(alice).register();
      await contract.connect(bob).register();
    });

    it("creates a market request", async function () {
      await expect(
        contract
          .connect(alice)
          .createMarketRequest("Dining hall wait > 10 min?")
      )
        .to.emit(contract, "RequestCreated")
        .withArgs(0, "Dining hall wait > 10 min?");

      const r = await contract.getMarketRequest(0);
      expect(r.question).to.equal("Dining hall wait > 10 min?");
      expect(r.creator).to.equal(alice.address);
      expect(r.totalStake).to.equal(0);
      expect(r.activated).to.be.false;
    });

    it("allows staking credits toward a request", async function () {
      await contract
        .connect(alice)
        .createMarketRequest("Gym occupancy > 80%?");

      await expect(contract.connect(bob).stakeForRequest(0, 100))
        .to.emit(contract, "StakedForRequest")
        .withArgs(bob.address, 0, 100);

      const r = await contract.getMarketRequest(0);
      expect(r.totalStake).to.equal(100);

      expect(await contract.getUserBalance(bob.address)).to.equal(900);
    });

    it("activates request when threshold reached", async function () {
      await contract
        .connect(alice)
        .createMarketRequest("Dining hall wait > 10 min?");

      await contract.connect(alice).stakeForRequest(0, 300);

      // Bob pushes it over the 500 threshold
      await expect(contract.connect(bob).stakeForRequest(0, 200))
        .to.emit(contract, "RequestActivated")
        .withArgs(0);

      const r = await contract.getMarketRequest(0);
      expect(r.activated).to.be.true;
      expect(r.totalStake).to.equal(500);
    });

    it("rejects staking on an already activated request", async function () {
      await contract
        .connect(alice)
        .createMarketRequest("Dining hall wait > 10 min?");
      await contract.connect(alice).stakeForRequest(0, 500);

      await expect(
        contract.connect(bob).stakeForRequest(0, 100)
      ).to.be.revertedWith("already activated");
    });

    it("rejects staking with insufficient credits", async function () {
      await contract
        .connect(alice)
        .createMarketRequest("Gym occupancy > 80%?");

      await expect(
        contract.connect(bob).stakeForRequest(0, 2000)
      ).to.be.revertedWith("insufficient credits");
    });

    it("rejects zero-amount staking", async function () {
      await contract
        .connect(alice)
        .createMarketRequest("Gym occupancy > 80%?");

      await expect(
        contract.connect(bob).stakeForRequest(0, 0)
      ).to.be.revertedWith("zero stake");
    });
  });

  // ---------------------------------------------------------------
  // View functions
  // ---------------------------------------------------------------

  describe("View functions", function () {
    it("getCurrentPrices returns 50/50 for a fresh market", async function () {
      await contract.createMarket("q", "loc", "met", 50, 0, 1, "src");
      const [y, n] = await contract.getCurrentPrices(0);
      expect(y).to.equal(5000n);
      expect(n).to.equal(5000n);
    });

    it("getMarket returns all fields", async function () {
      await contract.createMarket(
        "Test?",
        "Place",
        "metric",
        42,
        100,
        200,
        "source"
      );
      const m = await contract.getMarket(0);
      expect(m.question).to.equal("Test?");
      expect(m.locationName).to.equal("Place");
      expect(m.metricName).to.equal("metric");
      expect(m.threshold).to.equal(42);
      expect(m.startTime).to.equal(100);
      expect(m.endTime).to.equal(200);
      expect(m.settlementSource).to.equal("source");
    });
  });
});
