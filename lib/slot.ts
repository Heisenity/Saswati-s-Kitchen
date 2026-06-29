import type { SlotType } from "@prisma/client";

type SlotState =
  | { lunch: "OPEN" | "CLOSED"; dinner: "NOT_OPEN" | "OPEN" | "CLOSED"; activeSlot: SlotType | null; label: string }
  | { lunch: "OPEN" | "CLOSED"; dinner: "NOT_OPEN" | "OPEN" | "CLOSED"; activeSlot: null; label: string };

function getIstParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return { hour, minute, minutes: hour * 60 + minute };
}

function parseTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function getSlotState(settings: {
  lunchCloseTime: string;
  dinnerOpenTime: string;
  dinnerCloseTime: string;
}, date = new Date()): SlotState {
  const now = getIstParts(date).minutes;
  const lunchClose = parseTime(settings.lunchCloseTime);
  const dinnerOpen = parseTime(settings.dinnerOpenTime);
  const dinnerClose = parseTime(settings.dinnerCloseTime);

  if (now < lunchClose) {
    return {
      lunch: "OPEN",
      dinner: "NOT_OPEN",
      activeSlot: "LUNCH",
      label: "Lunch Open"
    };
  }

  if (now < dinnerOpen) {
    return {
      lunch: "CLOSED",
      dinner: "NOT_OPEN",
      activeSlot: null,
      label: "Dinner Opens at 3 PM"
    };
  }

  if (now >= dinnerOpen && now < dinnerClose) {
    return {
      lunch: "CLOSED",
      dinner: "OPEN",
      activeSlot: "DINNER",
      label: "Dinner Ordering Open"
    };
  }

  return {
    lunch: "CLOSED",
    dinner: "CLOSED",
    activeSlot: null,
    label: "Today’s Ordering Closed"
  };
}

export function assertSlotAvailable(
  settings: {
    lunchCloseTime: string;
    dinnerOpenTime: string;
    dinnerCloseTime: string;
  },
  requestedSlot: SlotType,
  date = new Date()
) {
  const state = getSlotState(settings, date);

  if (requestedSlot === "LUNCH" && state.lunch !== "OPEN") {
    throw new Error("Lunch ordering is closed after 9:00 AM IST.");
  }

  if (requestedSlot === "DINNER" && state.dinner !== "OPEN") {
    throw new Error("Dinner orders are accepted only between 3:00 PM and 5:00 PM IST.");
  }

  return state;
}
