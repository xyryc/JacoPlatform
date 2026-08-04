import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

type PickerMode = "date" | "time" | null;

type SchedulePickerFieldsProps = {
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
};

export const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateInputValue = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const buildScheduleDateTime = (dateValue: string, timeValue: string) => {
  const date = parseDateInputValue(dateValue);
  const [hour, minute] = normalizeTimeValue(timeValue).split(":").map(Number);
  if (!date || !Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  date.setHours(hour, minute, 0, 0);
  return date;
};

export const isFutureSchedule = (dateValue: string, timeValue: string) => {
  const schedule = buildScheduleDateTime(dateValue, timeValue);
  return Boolean(schedule && schedule.getTime() > Date.now());
};

const monthTitle = (date: Date) =>
  date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

const formatTimeLabel = (totalMinutes: number) => {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
};

const normalizeTimeValue = (timeValue: string) => {
  const value = String(timeValue || "").trim();
  const meridiemMatch = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (meridiemMatch) {
    const rawHour = Number(meridiemMatch[1]);
    const minute = Number(meridiemMatch[2]);
    const period = meridiemMatch[3].toUpperCase();
    if (rawHour >= 1 && rawHour <= 12 && minute >= 0 && minute <= 59) {
      const hour = period === "PM" ? (rawHour % 12) + 12 : rawHour % 12;
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }
  }

  const [rawHour, rawMinute] = value.split(":").map(Number);
  if (Number.isFinite(rawHour) && Number.isFinite(rawMinute) && rawHour >= 0 && rawHour <= 23 && rawMinute >= 0 && rawMinute <= 59) {
    return `${String(rawHour).padStart(2, "0")}:${String(rawMinute).padStart(2, "0")}`;
  }

  return "";
};

export const toScheduleTimeLabel = (timeValue: string) => {
  const normalized = normalizeTimeValue(timeValue);
  const [hour, minute] = normalized.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "";
  return formatTimeLabel(hour * 60 + minute);
};

const toTimeInputValue = (hour: number, minute: number, period: "AM" | "PM") => {
  const normalizedHour = period === "PM" ? (hour % 12) + 12 : hour % 12;
  return `${String(normalizedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const toTimeParts = (timeValue: string) => {
  const normalized = normalizeTimeValue(timeValue);
  const [rawHour, rawMinute] = normalized.split(":").map(Number);
  if (!Number.isFinite(rawHour) || !Number.isFinite(rawMinute)) {
    return { hour: 10, minute: 0, period: "AM" as const };
  }

  return {
    hour: rawHour % 12 || 12,
    minute: rawMinute,
    period: rawHour >= 12 ? ("PM" as const) : ("AM" as const),
  };
};

const buildCalendarDays = (monthDate: Date) => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
};

export function SchedulePickerFields({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  className = "flex-row mb-6",
  inputClassName = "bg-white",
  labelClassName = "text-[14px] font-bold text-[#1A2C42] mb-2 ml-1",
}: SchedulePickerFieldsProps) {
  const [activePicker, setActivePicker] = useState<PickerMode>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfDay(new Date()));
  const [tempHour, setTempHour] = useState(10);
  const [tempMinute, setTempMinute] = useState(0);
  const [tempPeriod, setTempPeriod] = useState<"AM" | "PM">("AM");
  const today = startOfDay(new Date());
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const timeLabel = toScheduleTimeLabel(timeValue);
  const tempTimeValue = toTimeInputValue(tempHour, tempMinute, tempPeriod);
  const canConfirmTime = isFutureSchedule(dateValue || toDateInputValue(new Date()), tempTimeValue);
  const canGoToPreviousMonth =
    calendarMonth.getFullYear() > today.getFullYear() ||
    (calendarMonth.getFullYear() === today.getFullYear() && calendarMonth.getMonth() > today.getMonth());

  const openDatePicker = () => {
    const selectedDate = parseDateInputValue(dateValue);
    setCalendarMonth(selectedDate || startOfDay(new Date()));
    setActivePicker("date");
  };

  const openTimePicker = () => {
    const parts = toTimeParts(timeValue);
    setTempHour(parts.hour);
    setTempMinute(parts.minute);
    setTempPeriod(parts.period);
    setActivePicker("time");
  };

  const selectPreferredDate = (date: Date) => {
    const value = toDateInputValue(date);
    onDateChange(value);
    if (timeValue && !isFutureSchedule(value, timeValue)) {
      onTimeChange("");
    }
    setActivePicker(null);
  };

  const shiftCalendarMonth = (direction: -1 | 1) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  const confirmTime = () => {
    if (!canConfirmTime) {
      Alert.alert("Select a future time", "Please choose a time later than now.");
      return;
    }

    onTimeChange(tempTimeValue);
    setActivePicker(null);
  };

  return (
    <>
      <View className={className}>
        <View className="flex-1 mr-3">
          <Text className={labelClassName}>Preferred Date</Text>
          <TouchableOpacity
            onPress={openDatePicker}
            className={`${inputClassName} rounded-[18px] px-4 py-4 min-h-[54px] flex-row items-center justify-between`}
          >
            <Text className={`text-[15px] font-semibold ${dateValue ? "text-[#1A2C42]" : "text-[#94A3B8]"}`}>
              {dateValue || "Select date"}
            </Text>
            <Ionicons name="calendar-outline" size={18} color="#2286BE" />
          </TouchableOpacity>
        </View>

        <View className="flex-1">
          <Text className={labelClassName}>Preferred Time</Text>
          <TouchableOpacity
            onPress={openTimePicker}
            className={`${inputClassName} rounded-[18px] px-4 py-4 min-h-[54px] flex-row items-center justify-between`}
          >
            <Text className={`text-[15px] font-semibold ${timeLabel ? "text-[#1A2C42]" : "text-[#94A3B8]"}`}>
              {timeLabel || "Select time"}
            </Text>
            <Ionicons name="time-outline" size={18} color="#2286BE" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={Boolean(activePicker)} animationType="slide" transparent onRequestClose={() => setActivePicker(null)}>
        <View className="flex-1 justify-end bg-black/40">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setActivePicker(null)} />
          <View className="max-h-[70%] rounded-t-[28px] bg-white px-6 pb-8 pt-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[20px] font-black text-[#1A2C42]">
                {activePicker === "date" ? "Select Preferred Date" : "Select Preferred Time"}
              </Text>
              <TouchableOpacity onPress={() => setActivePicker(null)} className="h-10 w-10 items-center justify-center rounded-full bg-[#F8FAFC]">
                <Ionicons name="close" size={20} color="#1A2C42" />
              </TouchableOpacity>
            </View>

            {activePicker === "date" ? (
              <View>
                <View className="mb-4 flex-row items-center justify-between">
                  <TouchableOpacity
                    disabled={!canGoToPreviousMonth}
                    onPress={() => shiftCalendarMonth(-1)}
                    className={`h-10 w-10 items-center justify-center rounded-full ${canGoToPreviousMonth ? "bg-[#EAF3FA]" : "bg-gray-100"}`}
                  >
                    <Ionicons name="chevron-back" size={20} color={canGoToPreviousMonth ? "#2286BE" : "#CBD5E1"} />
                  </TouchableOpacity>
                  <Text className="text-[17px] font-black text-[#1A2C42]">{monthTitle(calendarMonth)}</Text>
                  <TouchableOpacity onPress={() => shiftCalendarMonth(1)} className="h-10 w-10 items-center justify-center rounded-full bg-[#EAF3FA]">
                    <Ionicons name="chevron-forward" size={20} color="#2286BE" />
                  </TouchableOpacity>
                </View>

                <View className="mb-2 flex-row">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <Text key={day} className="flex-1 text-center text-[11px] font-black uppercase text-[#94A3B8]">
                      {day}
                    </Text>
                  ))}
                </View>

                <View className="flex-row flex-wrap">
                  {calendarDays.map((date) => {
                    const value = toDateInputValue(date);
                    const isOutsideMonth = date.getMonth() !== calendarMonth.getMonth();
                    const isPast = startOfDay(date).getTime() < today.getTime();
                    const isSelected = dateValue === value;
                    const isToday = isSameDay(date, new Date());

                    return (
                      <TouchableOpacity key={value} disabled={isPast} onPress={() => selectPreferredDate(date)} className="w-[14.285%] p-1">
                        <View
                          className={`h-10 items-center justify-center rounded-[14px] ${
                            isSelected ? "bg-[#2286BE]" : isPast ? "bg-transparent" : isToday ? "bg-[#EAF3FA]" : "bg-[#F8FAFC]"
                          }`}
                        >
                          <Text
                            className={`text-[13px] font-bold ${
                              isSelected
                                ? "text-white"
                                : isPast
                                  ? "text-[#CBD5E1]"
                                  : isOutsideMonth
                                    ? "text-[#94A3B8]"
                                    : "text-[#1A2C42]"
                            }`}
                          >
                            {date.getDate()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View>
                <Text className="mb-3 text-[12px] font-bold uppercase tracking-[0.14em] text-[#7C8B95]">Hour</Text>
                <View className="mb-5 flex-row flex-wrap">
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => (
                    <TouchableOpacity key={hour} onPress={() => setTempHour(hour)} className="w-1/4 p-1">
                      <View className={`rounded-[16px] py-3 items-center ${tempHour === hour ? "bg-[#2286BE]" : "bg-[#F8FAFC]"}`}>
                        <Text className={`font-black ${tempHour === hour ? "text-white" : "text-[#1A2C42]"}`}>{hour}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text className="mb-3 text-[12px] font-bold uppercase tracking-[0.14em] text-[#7C8B95]">Minute</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
                  {Array.from({ length: 60 }, (_, minute) => (
                    <TouchableOpacity key={minute} onPress={() => setTempMinute(minute)} className="mr-2">
                      <View className={`min-w-[52px] rounded-[16px] px-4 py-3 items-center ${tempMinute === minute ? "bg-[#2286BE]" : "bg-[#F8FAFC]"}`}>
                        <Text className={`font-black ${tempMinute === minute ? "text-white" : "text-[#1A2C42]"}`}>
                          {String(minute).padStart(2, "0")}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text className="mb-3 text-[12px] font-bold uppercase tracking-[0.14em] text-[#7C8B95]">AM / PM</Text>
                <View className="mb-5 flex-row rounded-[18px] bg-[#F8FAFC] p-1">
                  {(["AM", "PM"] as const).map((period) => (
                    <TouchableOpacity
                      key={period}
                      onPress={() => setTempPeriod(period)}
                      className={`flex-1 rounded-[15px] py-3 items-center ${tempPeriod === period ? "bg-[#2286BE]" : ""}`}
                    >
                      <Text className={`font-black ${tempPeriod === period ? "text-white" : "text-[#1A2C42]"}`}>{period}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View className="mb-5 rounded-[18px] bg-[#EAF3FA] px-4 py-3">
                  <Text className="text-center text-[13px] font-bold text-[#1A2C42]">
                    Selected: {toScheduleTimeLabel(tempTimeValue)}
                  </Text>
                  {!canConfirmTime ? (
                    <Text className="mt-1 text-center text-[12px] font-semibold text-[#DC2626]">
                      Please select a future time.
                    </Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  disabled={!canConfirmTime}
                  onPress={confirmTime}
                  className={`rounded-[18px] py-4 items-center ${canConfirmTime ? "bg-[#2286BE]" : "bg-gray-200"}`}
                >
                  <Text className={`font-black ${canConfirmTime ? "text-white" : "text-[#94A3B8]"}`}>Confirm Time</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
