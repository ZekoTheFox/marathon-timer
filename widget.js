// marathon-timer widget, written by zeko (https://zeko.party)

const texts = {
  "twitch_follower-latest": "%user has followed! %time", // equivalent to youtube subscriber
  "twitch_subscriber-latest": "%user subscribed for %unit month(s)! %time", // equivalent to youtube sponsor/membership
  "twitch_cheer-latest": "%user cheered %unit bits! %time", // equivalent to youtube superchat
  "twitch_host-latest": "%user has hosted with %unit viewers! %time",
  "twitch_raid-latest": "%user raided with %unit viewers! %time",
  "youtube_subscriber-latest": "%user has subscribed! %time", // equivalent to twitch follower
  "youtube_sponsor-latest":
    "%user bought a membership for %unit month(s)! %time", // equivalent to twitch subscriber
  "youtube_superchat-latest": "%user superchat'd $%unit dollars! %time", // equivalent to twitch cheer (but actual money instead of bits)
  "tip-latest": "%user tipped $%unit! %time",
};

const containerMappings = {
  none: {
    start: "",
    end: "",
  },
  regular: {
    start: "(",
    end: ")",
  },
  square: {
    start: "[",
    end: "]",
  },
  braces: {
    start: "{",
    end: "}",
  },
  angle: {
    start: "<",
    end: ">",
  },
};

const displayTime = Ola(Date.now(), 2000);
let _timer;
let state = {
  targetTime: -1,
  finished: true,
  paused: true,
  pausedAt: -1,
};
let options = {
  // timer
  timerDataSource: "twitch",
  timerFollowerWorth: 45,
  timerPaidMembershipWorth: 300,
  timerGiftedPaidMembershipWorth: 180,
  timerChatTipWorth: 1,
  timerTwitchViewerWorth: 1.5,
  timerSETipWorth: 30,

  timerInitial: 90,
  timerMaximum: 720,

  timerEndTimeShown: true,
  eventlogShown: true,
  eventlogMaximum: 5,
  // controls
  addMinutesAmount: 5,

  // display
  displaySecondsPlusSign: true,
  displaySecondsSuffix: "lowercase",
  displaySecondsContainer: "regular",
}; // this gets overridden when loading; the names are here for type hinting

let __internal_log_index = 0;
/**
 * internal log, written to `#logs` for debugging purposes
 * this is used in place of `console.log` since widgets aren't allowed to access it
 */
function _l(text) {
  id("logs").innerHTML =
    `[${__internal_log_index.toString().padStart("4", "0")}] ${text}` +
    "\n" +
    id("logs").innerHTML;

  ++__internal_log_index;
}

function roundAmount(value) {
  return Math.floor(value * 10) / 10
}

function timerPause() {
  state.paused = true;
  state.pausedAt = Date.now();

  clearInterval(_timer);

  logSystem("paused timer");
}

function timerEnd() {
  state.finished = true;
  state.paused = true;
  state.pausedAt = -1;
  state.targetTime = -1;
  displayTime.value = Date.now() + options.timerInitial * 60_000;

  clearInterval(_timer);

  logSystem("reset timer");
}

function timerStart() {
  if (state.paused && !state.finished) {
    state.targetTime += Date.now() - state.pausedAt;
  }

  if (state.finished) {
    state.targetTime = Date.now() + options.timerInitial * 60_000;
  }

  state.finished = false;
  state.paused = false;
  state.pausedAt = -1;
  displayTime.value = state.targetTime;

  _timer = setInterval(updateCountdown, 30);

  updateEndTime(`Ends at ${new Date(state.targetTime).toLocaleTimeString()}`);

  logSystem("timer started");
}

/**
 * adds seconds to the timer, or do nothing if the timer is stopped/paused
 * @param {number} amount the amount of seconds to add
 */
function timerAddSeconds(amount) {
  if (state.paused || state.finished) {
    return;
  }

  state.targetTime += amount * 1_000;

  const cappedTargetTime = Date.now() + options.timerMaximum * 60_000;

  if (state.targetTime >= cappedTargetTime) {
    state.targetTime = cappedTargetTime;
  }

  // animate to new time
  displayTime.value = state.targetTime;

  // update end time
  updateEndTime(`Ends at ${new Date(state.targetTime).toLocaleTimeString()}`);

  SE_API.store.set("mtimerstate", state);
}

/**
 * updates the countdown state
 */
function updateCountdown() {
  if (state.paused) {
    return;
  }

  const difference = new Date(displayTime.value - Date.now());

  const hours = Math.max(
    0,
    Math.floor((displayTime.value - Date.now()) / 3_600_000)
  );

  updateTimerCountdown(
    hours +
      ":" +
      difference.getMinutes().toString().padStart(2, "0") +
      ":" +
      difference.getSeconds().toString().padStart(2, "0")
  );

  if (state.targetTime <= Date.now()) {
    state.finished = true;
    state.paused = true;
    state.pausedAt = Number.MAX_SAFE_INTEGER;

    clearInterval(_timer);

    updateCountdown("0:00:00");
    updateEndTime("The countdown has finished!");

    logSystem("timer finished!");
  }
}

/**
 * sets the text for the end time display
 * @param {string} text string to set the end time to
 */
function updateEndTime(text) {
  id("timerEndTime").innerHTML = text;
}

/**
 * sets the text for the countdown
 * @param {string} text string to set to
 */
function updateTimerCountdown(text) {
  id("timerCountdown").innerHTML = text;
}

/**
 * returns the element matching the id
 * @param {string} name the target element's name
 * @param {string} extra additional css to add to the query
 * @returns {Element | null}
 */
function id(name, extra = "") {
  return document.querySelector(`#${name}${extra}`);
}

/**
 * creates an element
 * @param {string} element tagname of block element
 * @param {string} content content to be added
 * @param {string[]} styles css selectors to attach
 * @returns {HTMLElement}
 */
function create(element, content, styles) {
  const createdElement = document.createElement(element);
  const createdContentNode = document.createTextNode(content);

  createdElement.appendChild(createdContentNode);

  if (styles.length > 0) {
    createdElement.classList.add(...styles);
  }

  return createdElement;
}

/**
 * returns the corresponding worth value from an event as configured by the user
 * @param {{
 *  listener: string,
 *  event: {
 *    sender: string,
 *    tier: string,
 *    bulkGifted: boolean,
 *    gifted: boolean,
 *    isCommunityGift: boolean,
 *  }
 * }} object the event from streamelements
 * @returns {number}
 */
function worth(object) {
  const isSingleGift = object.event.gifted && !object.event.bulkGifted;
  const isBulkGifted = !object.event.isCommunityGift && object.event.bulkGifted;

  switch (object.listener) {
    case "cheer-latest":
    case "superchat-latest":
      return options.timerChatTipWorth;
    case "tip-latest":
      return options.timerSETipWorth;
    case "host-latest":
    case "raid-latest":
      return options.timerTwitchViewerWorth;
    case "follower-latest":
      return options.timerFollowerWorth;
    case "sponsor-latest":
      if (isSingleGift) {
        return options.timerGiftedPaidMembershipWorth;
      }
      return options.timerPaidMembershipWorth;
    case "subscriber-latest":
      if (options.timerDataSource === "twitch") {
        if (isBulkGifted || isSingleGift) {
          return options.timerGiftedPaidMembershipWorth;
        }

        const tier =
          object.event.tier === "prime"
            ? 1
            : parseInt(object.event.tier) / 1000;
        return options.timerPaidMembershipWorth * tier;
      }
      if (options.timerDataSource === "youtube") {
        return options.timerFollowerWorth;
      }
      break;
    default:
      logSystem("## unknown event worth! ##");
      break;
  }
}

/**
 * log an event with a specific string
 * @param {string} format format string
 *  `%user` is replaced with the user's name, `%unit` is the value of the event, `%time` is the calculated time addition
 * @param {{
 * listener: string,
 * event: {
 *  name: string,
 *  amount: number,
 * }}} data certain information values as seen from streamelements
 */
function log(format, data) {
  _l("log input data: " + JSON.stringify(data));
  _l("log str format: " + format);

  const chars = containerMappings[options.displaySecondsContainer];
  const suffix = options.displaySecondsSuffix === "none" ? "" : "s";
  const formattedTime =
    chars.start +
    (options.displaySecondsPlusSign ? "+" : "") +
    roundAmount(data.event.amount * worth(data)).toString() + // the actual time in seconds
    (options.displaySecondsSuffix === "uppercase" ? "S" : suffix) +
    chars.end;

  const userText = create("span", data.event.name, ["log__value", "spaced"]);
  const amountText = create("span", roundAmount(data.event.amount), ["log__value"]);
  const additionText = create("span", formattedTime, ["log__time", "spaced"]);

  const nodes = [];
  const order = [
    format.indexOf("%user"),
    format.indexOf("%unit"),
    format.indexOf("%time"),
  ].sort((a, b) => a - b);
  let workingString = format;
  let indexOffset = 0;

  _l(`format order: ${JSON.stringify(order)}`);
  for (const index of order) {
    if (index === -1) continue;

    const position = index - indexOffset;

    if (position > 0) {
      nodes.push(
        create(
          "span",
          workingString.substring(0, position),
          position > 2 ? ["spaced"] : []
        )
      );
    }

    // remove normal text
    _l(
      `text incl = ${index} / ${position} / ${workingString.substring(
        index,
        workingString.length
      )}`
    );
    workingString = workingString.substring(position, workingString.length);

    switch (workingString.substring(0, 5)) {
      case "%user":
        nodes.push(userText);
        break;
      case "%unit":
        nodes.push(amountText);
        break;
      case "%time":
        nodes.push(additionText);
        break;
      default:
        _l(`skipped identifier check; str = ${workingString}`);
        continue;
    }

    // remove the identifier
    workingString = workingString.substring(5, workingString.length);
    indexOffset = format.indexOf(workingString);

    _l(`worked on string; new = ${workingString}`);
  }

  if (workingString.length > 0) {
    nodes.push(create("span", workingString, ["spaced"]));
  }

  // assemble the `<li>` element
  const log = document.createElement("li");
  log.setAttribute("data-event", "log");

  for (const node of nodes) {
    log.appendChild(node);
  }

  id("eventLogList").prepend(log);
}

/**
 * log an event that isn't a user action
 * @param {string} text
 */
function logSystem(text) {
  const textNode = document.createTextNode(`[ ${text} ]`);
  const item = document.createElement("li");

  item.appendChild(textNode);
  item.setAttribute("data-event", "internal");

  id("eventLogList").prepend(item);
}

window.addEventListener(
  "onEventReceived",
  function timerSecondsEvaluationEvent(object) {
    if (
      !object.detail.listener.endsWith("-latest") ||
      state.paused ||
      state.finished
    ) {
      return;
    }
    const { listener, event } = object.detail;

    const isBulkGifter = event.bulkGifted || event.isCommunityGift;
    const isGifted = event.gifted && !event.bulkGifted;

    const { amount } = event;
    switch (listener) {
      case "tip-latest":
        timerAddSeconds(amount * options.timerSETipWorth);
        break;
      case "cheer-latest":
      case "superchat-latest":
        timerAddSeconds(amount * options.timerChatTipWorth);
        break;
      case "host-latest":
      case "raid-latest":
        timerAddSeconds(amount * options.timerTwitchViewerWorth);
        break;
      case "sponsor-latest":
        timerAddSeconds(options.timerPaidMembershipWorth);
        break;
      case "subscriber-latest":
        if (options.timerDataSource === "youtube") {
          timerAddSeconds(options.timerFollowerWorth);
          break;
        }
        if (options.timerDataSource === "twitch") {
          if (isBulkGifter) {
            timerAddSeconds(amount * options.timerGiftedPaidMembershipWorth);
            break;
          }

          if (!bulkGifted && isGifted) {
            timerAddSeconds(
              options.timerPaidMembershipWorth *
                (event.tier === "prime" ? 1 : parseInt(event.tier) / 1000)
            );
          }
        }
        break;
      case "follower-latest":
        timerAddSeconds(options.timerFollowerWorth);
        break;
      default:
        logSystem("## invalid event! ##");
        return;
    }
  }
);

window.addEventListener("onEventReceived", function timerLogEvent(object) {
  if (
    !object.detail.listener.endsWith("-latest") ||
    state.paused ||
    state.finished
  ) {
    return;
  }

  const { listener } = object.detail;

  const formatKey = options.timerDataSource + "_" + listener;

  // handle any one-off events
  if (listener === "tip-latest") {
    log(texts["tip-latest"], object.detail);
    return;
  }

  if (!texts[formatKey]) {
    logSystem("## unknown format key! ##");
    return;
  }

  log(texts[formatKey], object.detail);
});
window.addEventListener("onEventReceived", function buttonEvent(object) {
  if (object.detail.event.listener !== "widget-button") {
    return;
  }

  const event = object.detail.event;

  switch (event.field) {
    case "buttonStart":
      timerStart();
      break;
    case "buttonEnd":
      timerEnd();
      break;
    case "buttonPause":
      timerPause();
      break;
    case "buttonAdd":
      if (state.paused) {
        return;
      }
      timerAddSeconds(180);
      logSystem("+3 minutes");
      break;
    default:
      break;
  }
});

window.addEventListener("onWidgetLoad", function setOptions(object) {
  options = object.detail.fieldData;

  // this was worse than typing out an array of timezones which i ended up deleting...
  texts["twitch_follower-latest"] = options.textTwitchFollower;
  texts["twitch_subscriber-latest"] = options.textTwitchSubscriber;
  texts["twitch_cheer-latest"] = options.textTwitchCheer;
  texts["twitch_host-latest"] = options.textTwitchHost;
  texts["twitch_raid-latest"] = options.textTwitchRaid;
  texts["youtube_subscriber-latest"] = options.textYoutubeSubscriber;
  texts["youtube_sponsor-latest"] = options.textYoutubeSponsor;
  texts["youtube_superchat-latest"] = options.textYoutubeSuperchat;
  texts["tip-latest"] = options.textGenericTip;

  id("eventLog").setAttribute("data-visible", options.eventlogShown);
  id("timerEndTime").setAttribute("data-visible", options.timerEndTimeShown);
});
window.addEventListener("onWidgetLoad", function initializeState() {
  // check if widget had previous state
  let lastState = null;
  SE_API.store.get("mtimerstate").then((obj) => {
    lastState = obj;
  });

  if (!lastState) {
    SE_API.store.set("mtimerstate", {
      targetTime: Date.now() + 3_600_000, // lol
      paused: true,
      pausedAt: -1,
    });
  }

  if (!!lastState) {
    state = lastState;
  }
});
