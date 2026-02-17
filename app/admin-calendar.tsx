import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View, TextInput, Modal } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";

export default function AdminCalendarScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalUserId, setModalUserId] = useState<string | null>(null);
  const [modalUserName, setModalUserName] = useState("");
  const [mNutrition, setMNutrition] = useState(false);
  const [mHydration, setMHydration] = useState(false);
  const [mMovement, setMMovement] = useState(false);
  const [mScripture, setMScripture] = useState(false);
  const [mLifeGroup, setMLifeGroup] = useState(false);
  const [mNotes, setMNotes] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserName, setEditUserName] = useState("");
  const [editNutrition, setEditNutrition] = useState(false);
  const [editHydration, setEditHydration] = useState(false);
  const [editMovement, setEditMovement] = useState(false);
  const [editScripture, setEditScripture] = useState(false);
  const [editNotes, setEditNotes] = useState("");

  const utils = trpc.useUtils();

  // Fetch all users
  const { data: users, isLoading: usersLoading } = trpc.admin.getAllUsers.useQuery();

  // Fetch check-ins for selected date
  const { data: checkIns, isLoading: checkInsLoading, refetch } = trpc.admin.getCheckInsByDate.useQuery(
    { date: selectedDate.toISOString() },
    { enabled: true }
  );

  // Fetch attendance for selected date
  const { data: attendance, refetch: refetchAttendance } = trpc.admin.getAttendanceByDate.useQuery(
    { date: selectedDate.toISOString() },
    { enabled: true }
  );

  const upsertCheckInMutation = trpc.admin.upsertCheckInForUserDate.useMutation({
    onSuccess: (data) => {
      console.log("Check-in saved successfully:", data);
      Alert.alert("Success", `Check-in ${data.action} successfully`);
      refetch();
      utils.metrics.getGroupLeaderboard.invalidate({ period: "week" });
      utils.metrics.getGroupLeaderboard.invalidate({ period: "overall" });
      setEditMode(false);
      setSelectedUserId(null);
    },
    onError: (error) => {
      console.error("Check-in error:", error);
      Alert.alert("Error", error.message || "Failed to save check-in. Check console for details.");
    },
  });

  const removeAttendanceMutation = trpc.admin.removeUserAttendance.useMutation({
    onSuccess: () => {
      refetchAttendance();
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to remove attendance.");
    },
  });

  const addAttendanceMutation = trpc.admin.addUserAttendance.useMutation({
    onSuccess: () => {
      console.log("Attendance saved successfully");
      Alert.alert("Success", "Attendance recorded successfully");
      refetchAttendance();
    },
    onError: (error) => {
      console.error("Attendance error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      Alert.alert("Error", `${error.message}\n\nCheck console for details.`);
    },
  });

  const openEdit = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setEditUserName(userName);
    const row = checkIns?.find((c: any) => String(c.userId) === String(userId));
    setEditNutrition(!!row?.nutritionDone);
    setEditHydration(!!row?.hydrationDone);
    setEditMovement(!!row?.movementDone);
    setEditScripture(!!row?.scriptureDone);
    setEditNotes(row?.notes ?? "");
    setShowEditModal(true);
  };

  const openUserCheckinModal = (userId: string, userName: string) => {
    setModalUserId(String(userId));
    setModalUserName(userName);
    // Prefill existing check-in toggles if present
    const existing = checkIns?.find((c: any) => String(c.userId) === String(userId));
    setMNutrition(!!existing?.nutritionDone);
    setMHydration(!!existing?.hydrationDone);
    setMMovement(!!existing?.movementDone);
    setMScripture(!!existing?.scriptureDone);
    setMNotes(existing?.notes ?? "");
    // Prefill life group attendance (weekly record)
    const hasAttendance = attendance?.some((a: any) => String(a.userId) === String(userId));
    setMLifeGroup(!!hasAttendance);
    setShowAddModal(true);
  };

  const handleQuickAddCheckIn = (userId: string, userName: string) => {
    if (!selectedDate) {
      Alert.alert("Error", "Please select a date first");
      return;
    }
    if (!userId) {
      Alert.alert("Error", "User ID is missing");
      return;
    }
    
    Alert.alert(
      "Quick Add Check-In",
      `Add full check-in (all 4 categories) for ${userName} on ${selectedDate.toLocaleDateString()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add All",
          onPress: async () => {
            try {
              const payload = {
                userId: String(userId),
                dateISO: selectedDate.toISOString(),
                nutritionDone: true,
                hydrationDone: true,
                movementDone: true,
                scriptureDone: true,
                notes: "Added by admin",
              };
              console.log("Adding check-in payload:", payload);
              console.log("Payload types:", { userId: typeof payload.userId, dateISO: typeof payload.dateISO });
              await upsertCheckInMutation.mutateAsync(payload);
            } catch (error: any) {
              console.error("Failed to add check-in:", error);
            }
          },
        },
      ]
    );
  };

  const handleAddAttendance = async (userId: string) => {
    if (!selectedDate) {
      Alert.alert("Error", "Please select a date first");
      return;
    }
    if (!userId) {
      Alert.alert("Error", "User ID is missing");
      return;
    }
    
    const payload = {
      userId: String(userId),
      date: selectedDate.toISOString(),
      attended: true,
    };
    console.log("Adding attendance payload:", payload);
    console.log("Payload types:", { userId: typeof payload.userId, date: typeof payload.date });
    try {
      await addAttendanceMutation.mutateAsync(payload);
    } catch (error: any) {
      console.error("Failed to add attendance:", error);
    }
  };

  if (usersLoading) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View>
            <TouchableOpacity onPress={() => router.back()} className="mb-4">
              <Text className="text-primary text-base">← Back</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground">Admin Calendar</Text>
            <Text className="text-sm text-muted mt-1">Manage user check-ins and attendance</Text>
          </View>

          {/* Date Picker */}
          <View className="bg-surface rounded-2xl p-4 shadow-sm border border-border">
            <Text className="text-sm font-semibold text-foreground mb-2">Select Date</Text>
            {Platform.OS === "web" ? (
              <View className="p-3 bg-background rounded-xl border border-border">
                <Text className="text-xs text-muted mb-2">Select Date</Text>
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value + 'T00:00:00');
                    if (!isNaN(newDate.getTime())) {
                      setSelectedDate(newDate);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: 'white',
                  }}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity 
                  onPress={() => setShowDatePicker(true)}
                  className="flex-row items-center justify-between p-3 bg-background rounded-xl border border-border"
                >
                  <Text className="text-base text-foreground">
                    {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </Text>
                  <Text className="text-primary text-sm">Change</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowDatePicker(Platform.OS === "ios");
                      if (date) setSelectedDate(date);
                    }}
                  />
                )}
              </>
            )}
          </View>

          {/* Check-Ins Summary */}
          <View className="bg-surface rounded-2xl p-4 shadow-sm border border-border">
            <Text className="text-lg font-bold text-foreground mb-3">Daily Check-Ins</Text>
            {checkInsLoading ? (
              <ActivityIndicator />
            ) : checkIns && checkIns.length > 0 ? (
              <View className="gap-2">
                {checkIns.map((checkIn: any) => (
                  <TouchableOpacity
                    key={checkIn.id}
                    onPress={() => openEdit(String(checkIn.userId), checkIn.user?.name ?? "Unknown User")}
                    className="p-3 bg-background rounded-xl border border-border"
                  >
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-sm font-semibold text-foreground">{checkIn.user?.name ?? "Unknown User"}</Text>
                        <Text className="text-xs text-muted mt-1">
                          Points: {[checkIn.nutritionDone, checkIn.hydrationDone, checkIn.movementDone, checkIn.scriptureDone].filter(Boolean).length}/4
                        </Text>
                      </View>
                      <Text className="text-primary text-sm">Edit</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-muted">No check-ins for this date</Text>
            )}
          </View>

          {/* Add Check-In for Users */}
          <View className="bg-surface rounded-2xl p-4 shadow-sm border border-border">
            <Text className="text-lg font-bold text-foreground mb-3">Add Check-In</Text>
            <Text className="text-xs text-muted mb-3">Select a user to add a check-in for the selected date</Text>
            <View className="gap-2">
              {users?.filter(Boolean).map((user: any) => (
                <TouchableOpacity
                  key={user.id}
                  onPress={() => openUserCheckinModal(user.id, user.name)}
                  className="p-3 bg-background rounded-xl border border-border flex-row items-center justify-between"
                >
                  <View>
                    <Text className="text-sm font-semibold text-foreground">{user.name}</Text>
                    <Text className="text-xs text-muted">{user.email}</Text>
                  </View>
                  <Text className="text-primary text-sm">+ Add</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Weekly Attendance */}
          <View className="bg-surface rounded-2xl p-4 shadow-sm border border-border">
            <Text className="text-lg font-bold text-foreground mb-3">Life Group Attendance</Text>
            <Text className="text-xs text-muted mb-3">Mark attendance for the selected date</Text>
            <View className="gap-2">
              {users?.filter(Boolean).map((user: any) => {
                const hasAttendance = attendance?.some((a: any) => a.userId === user.id);
                return (
                  <TouchableOpacity
                    key={user.id}
                    onPress={() => !hasAttendance && handleAddAttendance(user.id)}
                    disabled={hasAttendance}
                    className={`p-3 rounded-xl border flex-row items-center justify-between ${
                      hasAttendance ? "bg-primary/10 border-primary" : "bg-background border-border"
                    }`}
                  >
                    <View>
                      <Text className="text-sm font-semibold text-foreground">{user.name}</Text>
                      <Text className="text-xs text-muted">{user.email}</Text>
                    </View>
                    {hasAttendance ? (
                      <Text className="text-primary text-sm font-bold">✓ Present</Text>
                    ) : (
                      <Text className="text-muted text-sm">+ Mark Present</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
      {showEditModal && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center p-6">
          <View className="bg-white rounded-2xl p-5 w-full">
            <Text className="text-xl font-bold mb-2">Edit: {editUserName}</Text>
            <Text className="text-xs text-muted mb-3">{selectedDate.toLocaleDateString()}</Text>
            {[
              ["Nutrition", editNutrition, setEditNutrition],
              ["Hydration", editHydration, setEditHydration],
              ["Movement", editMovement, setEditMovement],
              ["Scripture", editScripture, setEditScripture],
            ].map(([label, value, setter]: any) => (
              <TouchableOpacity
                key={label}
                onPress={() => setter(!value)}
                className={`p-4 rounded-xl border-2 mb-2 ${value ? "bg-muted border-primary" : "border-border"}`}
              >
                <Text className="text-base font-semibold">{value ? "✅ " : ""}{label}</Text>
              </TouchableOpacity>
            ))}
            <TextInput
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Notes (optional)"
              className="border rounded-xl p-3 mt-2"
              multiline
            />
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                className="flex-1 p-3 rounded-xl bg-gray-200"
              >
                <Text className="text-center font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (!selectedUserId) return;
                  upsertCheckInMutation.mutate({
                    userId: selectedUserId,
                    dateISO: selectedDate.toISOString(),
                    nutritionDone: editNutrition,
                    hydrationDone: editHydration,
                    movementDone: editMovement,
                    scriptureDone: editScripture,
                    notes: editNotes || undefined,
                  });
                  setShowEditModal(false);
                }}
                className="flex-1 p-3 rounded-xl bg-black"
              >
                <Text className="text-center font-semibold text-white">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

        {showAddModal && (
          <Modal transparent animationType="fade" visible={showAddModal} onRequestClose={() => setShowAddModal(false)}>
            <View className="flex-1 items-center justify-center bg-black/50 p-6">
              <View className="w-full max-w-md bg-white rounded-2xl p-5">
                <Text className="text-xl font-bold text-foreground mb-1">{modalUserName}</Text>
                <Text className="text-xs text-muted mb-4">{selectedDate.toLocaleDateString()}</Text>

                {[
                  ["🥗 Nutrition", mNutrition, setMNutrition],
                  ["💧 Hydration", mHydration, setMHydration],
                  ["🏃 Movement", mMovement, setMMovement],
                  ["📖 Scripture", mScripture, setMScripture],
                  ["👥 Life Group", mLifeGroup, setMLifeGroup],
                ].map(([label, value, setter]: any) => (
                  <TouchableOpacity
                    key={label}
                    onPress={() => setter(!value)}
                    className={`p-4 rounded-xl border-2 mb-2 flex-row items-center justify-between ${
                      value ? "bg-muted border-primary" : "bg-background border-border"
                    }`}
                  >
                    <Text className="text-base font-semibold text-foreground">{label}</Text>
                    <Text className="text-xs text-muted">{value ? "Selected" : "Tap to select"}</Text>
                  </TouchableOpacity>
                ))}

                <TextInput
                  value={mNotes}
                  onChangeText={setMNotes}
                  placeholder="Notes (optional)"
                  className="border border-border rounded-xl p-3 mt-2"
                  multiline
                />

                <View className="flex-row gap-3 mt-4">
                  <TouchableOpacity
                    onPress={() => setShowAddModal(false)}
                    className="flex-1 p-3 rounded-xl bg-gray-200"
                  >
                    <Text className="text-center font-semibold">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={async () => {
                      if (!modalUserId) return;

                      // Save check-in (nutrition/hydration/movement/scripture)
                      await upsertCheckInMutation.mutateAsync({
                        userId: modalUserId,
                        dateISO: selectedDate.toISOString(),
                        nutritionDone: mNutrition,
                        hydrationDone: mHydration,
                        movementDone: mMovement,
                        scriptureDone: mScripture,
                        notes: mNotes || undefined,
                      });

                      // Toggle attendance (life group)
                      const hasAttendance = attendance?.some((a: any) => String(a.userId) === String(modalUserId));
                      if (mLifeGroup && !hasAttendance) {
                        await addAttendanceMutation.mutateAsync({
                          userId: modalUserId,
                          date: selectedDate.toISOString(),
                          attended: true,
                        });
                      }
                      if (!mLifeGroup && hasAttendance) {
                        await removeAttendanceMutation.mutateAsync({
                          userId: modalUserId,
                          date: selectedDate.toISOString(),
                        });
                      }

                      setShowAddModal(false);
                      setModalUserId(null);
                    }}
                    className="flex-1 p-3 rounded-xl bg-black"
                  >
                    <Text className="text-center font-semibold text-white">Submit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
    </ScreenContainer>
  );
}
