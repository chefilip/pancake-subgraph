/* eslint-disable prefer-const */
import { BigDecimal, BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import { concat } from "@graphprotocol/graph-ts/helper-functions";
import { Bet, Market, Round, User } from "../generated/schema";
import {
  BetBear,
  BetBull,
  Claim,
  EndRound,
  LockRound,
  Pause,
  RewardsCalculated,
  StartRound,
  Unpause,
} from "../generated/PredictionV3/PredictionV3";

let ZERO_BI = BigInt.fromI32(0);
let ONE_BI = BigInt.fromI32(1);
let ZERO_BD = BigDecimal.fromString("0");
let HUNDRED_BD = BigDecimal.fromString("100");
let EIGHT_BD = BigDecimal.fromString("1e8");
let EIGHTEEN_BD = BigDecimal.fromString("1e18");

/**
 * PAUSE
 */

export function handlePause(event: Pause): void {
  let market = Market.load("1");
  if (market === null) {
    market = new Market("1");
    market.epoch = event.params.epoch.toString();
    market.paused = true;
    market.totalUsers = ZERO_BI;
    market.totalBets = ZERO_BI;
    market.totalBetsBull = ZERO_BI;
    market.totalBetsBear = ZERO_BI;
    market.totalCAKE = ZERO_BD;
    market.totalCAKEBull = ZERO_BD;
    market.totalCAKEBear = ZERO_BD;
    market.totalCAKETreasury = ZERO_BD;
    market.totalBetsClaimed = ZERO_BI;
    market.totalCAKEClaimed = ZERO_BD;
    market.winRate = HUNDRED_BD;
    market.averageCAKE = ZERO_BD;
    market.netCAKE = ZERO_BD;
    market.save();
  }
  market.epoch = event.params.epoch.toString();
  market.paused = true;
  market.save();

  // Pause event was called, cancelling rounds.
  let round = Round.load(event.params.epoch.toString());
  if (round === null) {
    round = new Round(event.params.epoch.toString());
    round.epoch = event.params.epoch;
    round.previous = event.params.epoch.equals(ZERO_BI) ? null : event.params.epoch.minus(ONE_BI).toString();
    round.startAt = event.block.timestamp;
    round.startBlock = event.block.number;
    round.startHash = event.transaction.hash;
    round.totalBets = ZERO_BI;
    round.totalAmount = ZERO_BD;
    round.bullBets = ZERO_BI;
    round.bullAmount = ZERO_BD;
    round.bearBets = ZERO_BI;
    round.bearAmount = ZERO_BD;
    round.save();
  }
  round.failed = true;
  round.save();

  // Also fail the previous round because it will not complete.
  let previousRound = Round.load(round.previous);
  if (previousRound !== null) {
    previousRound.failed = true;
    previousRound.save();
  }
}

export function handleUnpause(event: Unpause): void {
  let market = Market.load("1");
  if (market === null) {
    market = new Market("1");
    market.epoch = event.params.epoch.toString();
    market.paused = false;
    market.totalUsers = ZERO_BI;
    market.totalBets = ZERO_BI;
    market.totalBetsBull = ZERO_BI;
    market.totalBetsBear = ZERO_BI;
    market.totalCAKE = ZERO_BD;
    market.totalCAKEBull = ZERO_BD;
    market.totalCAKEBear = ZERO_BD;
    market.totalCAKETreasury = ZERO_BD;
    market.totalBetsClaimed = ZERO_BI;
    market.totalCAKEClaimed = ZERO_BD;
    market.winRate = HUNDRED_BD;
    market.averageCAKE = ZERO_BD;
    market.netCAKE = ZERO_BD;
    market.save();
  }
  market.epoch = event.params.epoch.toString();
  market.paused = false;
  market.save();
}

/**
 * ROUND
 */

export function handleStartRound(event: StartRound): void {
  let market = Market.load("1");
  if (market === null) {
    market = new Market("1");
    market.epoch = event.params.epoch.toString();
    market.paused = false;
    market.totalUsers = ZERO_BI;
    market.totalBets = ZERO_BI;
    market.totalBetsBull = ZERO_BI;
    market.totalBetsBear = ZERO_BI;
    market.totalCAKE = ZERO_BD;
    market.totalCAKEBull = ZERO_BD;
    market.totalCAKEBear = ZERO_BD;
    market.totalCAKETreasury = ZERO_BD;
    market.totalBetsClaimed = ZERO_BI;
    market.totalCAKEClaimed = ZERO_BD;
    market.winRate = HUNDRED_BD;
    market.averageCAKE = ZERO_BD;
    market.netCAKE = ZERO_BD;
    market.save();
  }
  market.epoch = event.params.epoch.toString();
  market.save();

  let round = Round.load(event.params.epoch.toString());
  if (round === null) {
    round = new Round(event.params.epoch.toString());
    round.epoch = event.params.epoch;
    round.previous = event.params.epoch.equals(ZERO_BI) ? null : event.params.epoch.minus(ONE_BI).toString();
    round.startAt = event.block.timestamp;
    round.startBlock = event.block.number;
    round.startHash = event.transaction.hash;
    round.totalBets = ZERO_BI;
    round.totalAmount = ZERO_BD;
    round.bullBets = ZERO_BI;
    round.bullAmount = ZERO_BD;
    round.bearBets = ZERO_BI;
    round.bearAmount = ZERO_BD;
    round.save();
  }
}

export function handleLockRound(event: LockRound): void {
  let round = Round.load(event.params.epoch.toString());
  if (round === null) {
    log.warning("Tried to lock round without an existing round (epoch: {}).", [event.params.epoch.toString()]);
    round = new Round(event.params.epoch.toString());
    round.epoch = event.params.epoch;
    round.previous = event.params.epoch.equals(ZERO_BI) ? null : event.params.epoch.minus(ONE_BI).toString();
    round.startAt = event.block.timestamp;
    round.startBlock = event.block.number;
    round.startHash = event.transaction.hash;
    round.totalBets = ZERO_BI;
    round.totalAmount = ZERO_BD;
    round.bullBets = ZERO_BI;
    round.bullAmount = ZERO_BD;
    round.bearBets = ZERO_BI;
    round.bearAmount = ZERO_BD;
    round.save();
  }
  round.lockAt = event.block.timestamp;
  round.lockBlock = event.block.number;
  round.lockHash = event.transaction.hash;
  round.lockPrice = event.params.price.divDecimal(EIGHT_BD);
  round.lockRoundId = event.params.roundId;
  round.save();
}

export function handleEndRound(event: EndRound): void {
  let round = Round.load(event.params.epoch.toString());
  if (round === null) {
    log.warning("Tried to end round without an existing round (epoch: {}).", [event.params.epoch.toString()]);
    round = new Round(event.params.epoch.toString());
    round.epoch = event.params.epoch;
    round.previous = event.params.epoch.equals(ZERO_BI) ? null : event.params.epoch.minus(ONE_BI).toString();
    round.startAt = event.block.timestamp;
    round.startBlock = event.block.number;
    round.startHash = event.transaction.hash;
    round.totalBets = ZERO_BI;
    round.totalAmount = ZERO_BD;
    round.bullBets = ZERO_BI;
    round.bullAmount = ZERO_BD;
    round.bearBets = ZERO_BI;
    round.bearAmount = ZERO_BD;
    round.save();
  }
  round.closeAt = event.block.timestamp;
  round.closeBlock = event.block.number;
  round.closeHash = event.transaction.hash;
  if (event.params.price) {
    round.closePrice = event.params.price.divDecimal(EIGHT_BD);
  }
  round.closeRoundId = event.params.roundId;

  // Get round result based on lock/close price.
  if (round.closePrice) {
    if (round.closePrice.equals(round.lockPrice as BigDecimal)) {
      round.position = "House";

      let market = Market.load("1");
      if (market === null) {
        log.error("Tried to query market after end round was called for a round (epoch: {})", [
          event.params.epoch.toString(),
        ]);
      } else {
        market.totalCAKETreasury = market.totalCAKETreasury.plus(round.totalAmount);
        market.netCAKE = market.netCAKE.plus(round.totalAmount);
        market.save();
      }
    } else if (round.closePrice.gt(round.lockPrice as BigDecimal)) {
      round.position = "Bull";
    } else if (round.closePrice.lt(round.lockPrice as BigDecimal)) {
      round.position = "Bear";
    } else {
      round.position = null;
    }

    round.failed = false;
  }

  round.save();
}

export function handleBetBull(event: BetBull): void {
  let market = Market.load("1");
  if (market === null) {
    log.error("Tried to query market with bet (Bull)", []);
    return;
  }
  market.totalBets = market.totalBets.plus(ONE_BI);
  market.totalBetsBull = market.totalBetsBull.plus(ONE_BI);
  market.totalCAKE = market.totalCAKE.plus(event.params.amount.divDecimal(EIGHTEEN_BD));
  market.totalCAKEBull = market.totalCAKEBull.plus(event.params.amount.divDecimal(EIGHTEEN_BD));
  market.winRate = market.totalBetsClaimed.divDecimal(market.totalBets.toBigDecimal()).times(HUNDRED_BD);
  market.averageCAKE = market.totalCAKE.div(market.totalBets.toBigDecimal());
  market.netCAKE = market.netCAKE.minus(event.params.amount.divDecimal(EIGHTEEN_BD));
  market.save();

  let round = Round.load(event.params.epoch.toString());
  if (round === null) {
    log.warning("Tried to bet (bull) without an existing round (epoch: {}).", [event.params.epoch.toString()]);
    round = new Round(event.params.epoch.toString());
    round.epoch = event.params.epoch;
    round.previous = event.params.epoch.equals(ZERO_BI) ? null : event.params.epoch.minus(ONE_BI).toString();
    round.startAt = event.block.timestamp;
    round.startBlock = event.block.number;
    round.startHash = event.transaction.hash;
    round.totalBets = ZERO_BI;
    round.totalAmount = ZERO_BD;
    round.bullBets = ZERO_BI;
    round.bullAmount = ZERO_BD;
    round.bearBets = ZERO_BI;
    round.bearAmount = ZERO_BD;
    round.save();
  }
  round.totalBets = round.totalBets.plus(ONE_BI);
  round.totalAmount = round.totalAmount.plus(event.params.amount.divDecimal(EIGHTEEN_BD));
  round.bullBets = round.bullBets.plus(ONE_BI);
  round.bullAmount = round.bullAmount.plus(event.params.amount.divDecimal(EIGHTEEN_BD));
  round.save();

  // Fail safe condition in case the user has not been created yet.
  let user = User.load(event.params.sender.toHex());
  if (user === null) {
    user = new User(event.params.sender.toHex());
    user.createdAt = event.block.timestamp;
    user.updatedAt = event.block.timestamp;
    user.block = event.block.number;
    user.totalBets = ZERO_BI;
    user.totalBetsBull = ZERO_BI;
    user.totalBetsBear = ZERO_BI;
    user.totalCAKE = ZERO_BD;
    user.totalCAKEBull = ZERO_BD;
    user.totalCAKEBear = ZERO_BD;
    user.totalBetsClaimed = ZERO_BI;
    user.totalCAKEClaimed = ZERO_BD;
    user.winRate = HUNDRED_BD;
    user.averageCAKE = ZERO_BD;
    user.netCAKE = ZERO_BD;

    market.totalUsers = market.totalUsers.plus(ONE_BI);
    market.save();
  }
  user.updatedAt = event.block.timestamp;
  user.totalBets = user.totalBets.plus(ONE_BI);
  user.totalBetsBull = user.totalBetsBull.plus(ONE_BI);
  user.totalCAKE = user.totalCAKE.plus(event.params.amount.divDecimal(EIGHTEEN_BD));
  user.totalCAKEBull = user.totalCAKEBull.plus(event.params.amount.divDecimal(EIGHTEEN_BD));
  if (user.totalBets.gt(ZERO_BI)) {
    user.winRate = user.totalBetsClaimed.divDecimal(user.totalBets.toBigDecimal()).times(HUNDRED_BD);
    user.averageCAKE = user.totalCAKE.div(user.totalBets.toBigDecimal());
  }
  user.netCAKE = user.netCAKE.minus(event.params.amount.divDecimal(EIGHTEEN_BD));
  user.save();

  let betId = concat(event.params.sender, Bytes.fromI32(event.params.epoch.toI32())).toHex();
  let bet = new Bet(betId);
  bet.round = round.id;
  bet.user = user.id;
  bet.hash = event.transaction.hash;
  bet.amount = event.params.amount.divDecimal(EIGHTEEN_BD);
  bet.position = "Bull";
  bet.claimed = false;
  bet.createdAt = event.block.timestamp;
  bet.updatedAt = event.block.timestamp;
  bet.block = event.block.number;
  bet.save();
}

export function handleBetBear(event: BetBear): void {
  let market = Market.load("1");
  if (market === null) {
    log.error("Tried to query market with bet (Bear)", []);
    return;
  }
  market.totalBets = market.totalBets.plus(ONE_BI);
  market.totalBetsBear = market.totalBetsBear.plus(ONE_BI);
  market.totalCAKE = market.totalCAKE.plus(event.params.amount.divDecimal(EIGHTEEN_BD));
  market.totalCAKEBear = market.totalCAKEBear.plus(event.params.amount.divDecimal(EIGHTEEN_BD));
  market.winRate = market.totalBetsClaimed.divDecimal(market.totalBets.toBigDecimal()).times(HUNDRED_BD);
  market.averageCAKE = market.totalCAKE.div(market.totalBets.toBigDecimal());
  market.netCAKE = market.netCAKE.minus(event.params.amount.divDecimal(EIGHTEEN_BD));
  market.save();

  let round = Round.load(event.params.epoch.toString());
  if (round === null) {
    log.warning("Tried to bet (bear) without an existing round (epoch: {}).", [event.params.epoch.toString()]);
    round = new Round(event.params.epoch.toString());
    round.epoch = event.params.epoch;
    round.previous = event.params.epoch.equals(ZERO_BI) ? null : event.params.epoch.minus(ONE_BI).toString();
    round.startAt = event.block.timestamp;
    round.startBlock = event.block.number;
    round.startHash = event.transaction.hash;
    round.totalBets = ZERO_BI;
    round.totalAmount = ZERO_BD;
    round.bullBets = ZERO_BI;
    round.bullAmount = ZERO_BD;
    round.bearBets = ZERO_BI;
    round.bearAmount = ZERO_BD;
    round.save();
  }
  round.totalBets = round.totalBets.plus(ONE_BI);
  round.totalAmount = round.totalAmount.plus(event.params.amount.divDecimal(EIGHTEEN_BD));
  round.bearBets = round.bearBets.plus(ONE_BI);
  round.bearAmount = round.bearAmount.plus(event.params.amount.divDecimal(EIGHTEEN_BD));
  round.save();

  // Fail safe condition in case the user has not been created yet.
  let user = User.load(event.params.sender.toHex());
  if (user === null) {
    user = new User(event.params.sender.toHex());
    user.createdAt = event.block.timestamp;
    user.updatedAt = event.block.timestamp;
    user.block = event.block.number;
    user.totalBets = ZERO_BI;
    user.totalBetsBull = ZERO_BI;
    user.totalBetsBear = ZERO_BI;
    user.totalCAKE = ZERO_BD;
    user.totalCAKEBull = ZERO_BD;
    user.totalCAKEBear = ZERO_BD;
    user.totalBetsClaimed = ZERO_BI;
    user.totalCAKEClaimed = ZERO_BD;
    user.winRate = HUNDRED_BD;
    user.averageCAKE = ZERO_BD;
    user.netCAKE = ZERO_BD;

    market.totalUsers = market.totalUsers.plus(ONE_BI);
    market.save();
  }
  user.updatedAt = event.block.timestamp;
  user.totalBets = user.totalBets.plus(ONE_BI);
  user.totalBetsBear = user.totalBetsBear.plus(ONE_BI);
  user.totalCAKE = user.totalCAKE.plus(event.params.amount.divDecimal(EIGHTEEN_BD));
  user.totalCAKEBear = user.totalCAKEBear.plus(event.params.amount.divDecimal(EIGHTEEN_BD));
  if (user.totalBets.gt(ZERO_BI)) {
    user.winRate = user.totalBetsClaimed.divDecimal(user.totalBets.toBigDecimal()).times(HUNDRED_BD);
    user.averageCAKE = user.totalCAKE.div(user.totalBets.toBigDecimal());
  }
  user.netCAKE = user.netCAKE.minus(event.params.amount.divDecimal(EIGHTEEN_BD));
  user.save();

  let betId = concat(event.params.sender, Bytes.fromI32(event.params.epoch.toI32())).toHex();
  let bet = new Bet(betId);
  bet.round = round.id;
  bet.user = user.id;
  bet.hash = event.transaction.hash;
  bet.amount = event.params.amount.divDecimal(EIGHTEEN_BD);
  bet.position = "Bear";
  bet.claimed = false;
  bet.createdAt = event.block.timestamp;
  bet.updatedAt = event.block.timestamp;
  bet.block = event.block.number;
  bet.save();
}

export function handleClaim(event: Claim): void {
  let betId = concat(event.params.sender, Bytes.fromI32(event.params.epoch.toI32())).toHex();
  let bet = Bet.load(betId);
  if (bet === null) {
    log.warning("Tried to query bet without an existing ID (betId: {})", [betId]);
  } else {
    bet.claimed = true;
    bet.claimedAt = event.block.timestamp;
    bet.claimedBlock = event.block.number;
    bet.claimedHash = event.transaction.hash;
    bet.claimedCAKE = event.params.amount.divDecimal(EIGHTEEN_BD);
    if (bet.amount.gt(ZERO_BD)) {
      bet.claimedNetCAKE = event.params.amount.divDecimal(EIGHTEEN_BD).minus(bet.amount);
    }
    bet.updatedAt = event.block.timestamp;
    bet.save();
  }

  let user = User.load(event.params.sender.toHex());
  if (user === null) {
    user = new User(event.params.sender.toHex());
    user.createdAt = event.block.timestamp;
    user.updatedAt = event.block.timestamp;
    user.block = event.block.number;
    user.totalBets = ZERO_BI;
    user.totalBetsBull = ZERO_BI;
    user.totalBetsBear = ZERO_BI;
    user.totalCAKE = ZERO_BD;
    user.totalCAKEBull = ZERO_BD;
    user.totalCAKEBear = ZERO_BD;
    user.totalBetsClaimed = ZERO_BI;
    user.totalCAKEClaimed = ZERO_BD;
    user.winRate = HUNDRED_BD;
    user.averageCAKE = ZERO_BD;
    user.netCAKE = ZERO_BD;
    user.save();
  }
  user.totalBetsClaimed = user.totalBetsClaimed.plus(ONE_BI);
  user.totalCAKEClaimed = user.totalCAKEClaimed.plus(event.params.amount.divDecimal(EIGHTEEN_BD));
  if (user.totalBets.gt(ZERO_BI)) {
    user.winRate = user.totalBetsClaimed.divDecimal(user.totalBets.toBigDecimal()).times(HUNDRED_BD);
  }
  user.netCAKE = user.netCAKE.plus(event.params.amount.divDecimal(EIGHTEEN_BD));
  user.save();

  let market = Market.load("1");
  if (market === null) {
    log.error("Tried to query market after a user claimed for a round (epoch: {})", [event.params.epoch.toString()]);
    return;
  }
  market.totalBetsClaimed = market.totalBetsClaimed.plus(ONE_BI);
  market.totalCAKEClaimed = market.totalCAKEClaimed.plus(event.params.amount.divDecimal(EIGHTEEN_BD));
  market.winRate = market.totalBetsClaimed.divDecimal(market.totalBets.toBigDecimal()).times(HUNDRED_BD);
  market.netCAKE = market.netCAKE.plus(event.params.amount.divDecimal(EIGHTEEN_BD));
  market.save();
}

export function handleRewardsCalculated(event: RewardsCalculated): void {
  let market = Market.load("1");
  if (market === null) {
    log.error("Tried to query market after rewards were calculated for a round (epoch: {})", [
      event.params.epoch.toString(),
    ]);
    return;
  }
  market.totalCAKETreasury = market.totalCAKETreasury.plus(event.params.treasuryAmount.divDecimal(EIGHTEEN_BD));
  market.save();
}
