// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title SignalLedger
/// @notice Play-money prediction market for campus congestion forecasting.
///         BU CAS CS595 / QST IT795 classroom demo.
contract SignalLedger {
    // ----------------------------------------------------------------
    // Constants
    // ----------------------------------------------------------------

    uint256 public constant INITIAL_CREDITS = 1000;
    uint256 public constant VIRTUAL_LIQUIDITY = 100;
    uint256 public constant BPS = 10_000;
    uint256 public constant ACTIVATION_THRESHOLD = 500;

    // ----------------------------------------------------------------
    // Enums
    // ----------------------------------------------------------------

    enum MarketStatus { Open, Settled }
    enum Outcome { None, Yes, No }

    // ----------------------------------------------------------------
    // Structs
    // ----------------------------------------------------------------

    struct Market {
        string question;
        string locationName;
        string metricName;
        uint256 threshold;
        uint256 startTime;
        uint256 endTime;
        string settlementSource;
        MarketStatus status;
        uint256 actualValue;
        Outcome winningOutcome;
        uint256 yesDemand;
        uint256 noDemand;
    }

    struct MarketRequest {
        string question;
        address creator;
        uint256 totalStake;
        bool activated;
    }

    // ----------------------------------------------------------------
    // State
    // ----------------------------------------------------------------

    address public admin;

    mapping(address => bool) public registered;
    mapping(address => uint256) public credits;

    uint256 public marketCount;
    mapping(uint256 => Market) private markets;

    /// user => marketId => YES shares
    mapping(address => mapping(uint256 => uint256)) public yesShares;
    /// user => marketId => NO shares
    mapping(address => mapping(uint256 => uint256)) public noShares;
    /// user => marketId => redeemed flag
    mapping(address => mapping(uint256 => bool)) public redeemed;

    uint256 public requestCount;
    mapping(uint256 => MarketRequest) private requests;
    /// user => requestId => amount staked
    mapping(address => mapping(uint256 => uint256)) public userStake;

    // ----------------------------------------------------------------
    // Events
    // ----------------------------------------------------------------

    event UserRegistered(address indexed user);
    event MarketCreated(uint256 indexed marketId);
    event TradePlaced(
        address indexed user,
        uint256 indexed marketId,
        bool isYes,
        uint256 shares,
        uint256 cost
    );
    event MarketSettled(
        uint256 indexed marketId,
        uint256 actualValue,
        Outcome winningOutcome
    );
    event Redeemed(
        address indexed user,
        uint256 indexed marketId,
        uint256 payout
    );
    event RequestCreated(uint256 indexed requestId, string question);
    event StakedForRequest(
        address indexed user,
        uint256 indexed requestId,
        uint256 amount
    );
    event RequestActivated(uint256 indexed requestId);

    // ----------------------------------------------------------------
    // Modifiers
    // ----------------------------------------------------------------

    modifier onlyAdmin() {
        require(msg.sender == admin, "only admin");
        _;
    }

    modifier onlyRegistered() {
        require(registered[msg.sender], "not registered");
        _;
    }

    // ----------------------------------------------------------------
    // Constructor
    // ----------------------------------------------------------------

    constructor() {
        admin = msg.sender;
    }

    // ----------------------------------------------------------------
    // Registration
    // ----------------------------------------------------------------

    function register() external {
        require(!registered[msg.sender], "already registered");
        registered[msg.sender] = true;
        credits[msg.sender] = INITIAL_CREDITS;
        emit UserRegistered(msg.sender);
    }

    // ----------------------------------------------------------------
    // Market creation (admin only)
    // ----------------------------------------------------------------

    function createMarket(
        string calldata _question,
        string calldata _locationName,
        string calldata _metricName,
        uint256 _threshold,
        uint256 _startTime,
        uint256 _endTime,
        string calldata _settlementSource
    ) external onlyAdmin returns (uint256 marketId) {
        marketId = marketCount++;
        Market storage m = markets[marketId];
        m.question = _question;
        m.locationName = _locationName;
        m.metricName = _metricName;
        m.threshold = _threshold;
        m.startTime = _startTime;
        m.endTime = _endTime;
        m.settlementSource = _settlementSource;
        // status defaults to Open (0), winningOutcome defaults to None (0)
        emit MarketCreated(marketId);
    }

    // ----------------------------------------------------------------
    // Pricing helpers
    // ----------------------------------------------------------------

    /// @notice Returns (yesPriceBps, noPriceBps) for the given market.
    function getCurrentPrices(uint256 _marketId)
        public
        view
        returns (uint256 yesPriceBps, uint256 noPriceBps)
    {
        Market storage m = markets[_marketId];
        yesPriceBps =
            ((m.yesDemand + VIRTUAL_LIQUIDITY) * BPS) /
            (m.yesDemand + m.noDemand + 2 * VIRTUAL_LIQUIDITY);
        noPriceBps = BPS - yesPriceBps;
    }

    // ----------------------------------------------------------------
    // Trading
    // ----------------------------------------------------------------

    function buyYes(uint256 _marketId, uint256 _shares)
        external
        onlyRegistered
    {
        _buy(_marketId, _shares, true);
    }

    function buyNo(uint256 _marketId, uint256 _shares)
        external
        onlyRegistered
    {
        _buy(_marketId, _shares, false);
    }

    function _buy(uint256 _marketId, uint256 _shares, bool _isYes) internal {
        require(_shares > 0, "zero shares");
        Market storage m = markets[_marketId];
        require(m.status == MarketStatus.Open, "market not open");

        (uint256 yesBps, uint256 noBps) = getCurrentPrices(_marketId);
        uint256 priceBps = _isYes ? yesBps : noBps;

        // cost = shares * priceBps / BPS, rounded up
        uint256 cost = (_shares * priceBps + BPS - 1) / BPS;
        require(credits[msg.sender] >= cost, "insufficient credits");

        credits[msg.sender] -= cost;

        if (_isYes) {
            yesShares[msg.sender][_marketId] += _shares;
            m.yesDemand += _shares;
        } else {
            noShares[msg.sender][_marketId] += _shares;
            m.noDemand += _shares;
        }

        emit TradePlaced(msg.sender, _marketId, _isYes, _shares, cost);
    }

    // ----------------------------------------------------------------
    // Settlement (admin only)
    // ----------------------------------------------------------------

    function settleMarket(uint256 _marketId, uint256 _actualValue)
        external
        onlyAdmin
    {
        Market storage m = markets[_marketId];
        require(m.status == MarketStatus.Open, "market not open");

        m.actualValue = _actualValue;
        m.winningOutcome = _actualValue >= m.threshold
            ? Outcome.Yes
            : Outcome.No;
        m.status = MarketStatus.Settled;

        emit MarketSettled(_marketId, _actualValue, m.winningOutcome);
    }

    // ----------------------------------------------------------------
    // Redemption
    // ----------------------------------------------------------------

    function redeem(uint256 _marketId) external onlyRegistered {
        Market storage m = markets[_marketId];
        require(m.status == MarketStatus.Settled, "not settled");
        require(!redeemed[msg.sender][_marketId], "already redeemed");

        redeemed[msg.sender][_marketId] = true;

        uint256 payout = 0;
        if (m.winningOutcome == Outcome.Yes) {
            payout = yesShares[msg.sender][_marketId];
        } else if (m.winningOutcome == Outcome.No) {
            payout = noShares[msg.sender][_marketId];
        }

        credits[msg.sender] += payout;
        emit Redeemed(msg.sender, _marketId, payout);
    }

    // ----------------------------------------------------------------
    // Market activation staking
    // ----------------------------------------------------------------

    function createMarketRequest(string calldata _question)
        external
        onlyRegistered
        returns (uint256 requestId)
    {
        requestId = requestCount++;
        requests[requestId].question = _question;
        requests[requestId].creator = msg.sender;
        emit RequestCreated(requestId, _question);
    }

    function stakeForRequest(uint256 _requestId, uint256 _amount)
        external
        onlyRegistered
    {
        require(_amount > 0, "zero stake");
        require(_requestId < requestCount, "invalid request");
        require(!requests[_requestId].activated, "already activated");
        require(credits[msg.sender] >= _amount, "insufficient credits");

        credits[msg.sender] -= _amount;
        requests[_requestId].totalStake += _amount;
        userStake[msg.sender][_requestId] += _amount;

        emit StakedForRequest(msg.sender, _requestId, _amount);

        if (requests[_requestId].totalStake >= ACTIVATION_THRESHOLD) {
            requests[_requestId].activated = true;
            emit RequestActivated(_requestId);
        }
    }

    // ----------------------------------------------------------------
    // View helpers
    // ----------------------------------------------------------------

    function getUserBalance(address _user) external view returns (uint256) {
        return credits[_user];
    }

    function getMarket(uint256 _marketId)
        external
        view
        returns (
            string memory question,
            string memory locationName,
            string memory metricName,
            uint256 threshold,
            uint256 startTime,
            uint256 endTime,
            string memory settlementSource,
            MarketStatus status,
            uint256 actualValue,
            Outcome winningOutcome,
            uint256 yesDemand,
            uint256 noDemand
        )
    {
        Market storage m = markets[_marketId];
        return (
            m.question,
            m.locationName,
            m.metricName,
            m.threshold,
            m.startTime,
            m.endTime,
            m.settlementSource,
            m.status,
            m.actualValue,
            m.winningOutcome,
            m.yesDemand,
            m.noDemand
        );
    }

    function getUserPosition(address _user, uint256 _marketId)
        external
        view
        returns (uint256 yes, uint256 no)
    {
        return (
            yesShares[_user][_marketId],
            noShares[_user][_marketId]
        );
    }

    function getMarketRequest(uint256 _requestId)
        external
        view
        returns (
            string memory question,
            address creator,
            uint256 totalStake,
            bool activated
        )
    {
        MarketRequest storage r = requests[_requestId];
        return (r.question, r.creator, r.totalStake, r.activated);
    }
}
