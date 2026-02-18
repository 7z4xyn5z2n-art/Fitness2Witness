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

  const [adjNutrition, setAdjNutrition] = useState("0");
  const [adjHydration, setAdjHydration] = useState("0");
  const [adjMovement, setAdjMovement] = useState("0");
  const [adjScripture, setAdjScripture] = useState("0");
  const [adjLifeGroup, setAdjLifeGroup] = useState("0");
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

  const adjustPointsMutation = trpc.admin.createPointAdjustmentForDate.useMutation({
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to adjust points.");
    },
  });

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
         // Disable buttons/spinners while requests are running
  const isSubmittingAdd =
    upsertCheckInMutation.isPending ||
    addAttendanceMutation.isPending ||
    removeAttendanceMutation.isPending ||
    adjustPointsMutation.isPending;

  // Edit modal only uses the upsert mutation
  
  const isSavingEdit = upsertCheckInMutation.isPending;
  const handleAddCheckin = async () => {
  if (!modalUserId) {
    Alert.alert("Error", "No user selected.");
    return;
  }

  try {
    // 1) Upsert the check-in
    await upsertCheckInMutation.mutateAsync({
      userId: String(modalUserId),
      dateISO: selectedDate.toISOString(),
      nutritionDone: mNutrition,
      hydrationDone: mHydration,
      movementDone: mMovement,
      scriptureDone: mScripture,
      lifeGroupAttended: mLifeGroup,
      notes: mNotes?.trim() ? mNotes.trim() : undefined,
    });

    // 2) Attendance: add/remove based on toggle
    // (We check what current attendance is for this user)
    const currentlyPresent = attendance?.some((a: any) => String(a.userId) === String(modalUserId));

    if (mLifeGroup && !currentlyPresent) {
      await addAttendanceMutation.mutateAsync({
        userId: String(modalUserId),
        date: selectedDate.toISOString(),
        attended: true,
      });
    }

    if (!mLifeGroup && currentlyPresent) {
      await removeAttendanceMutation.mutateAsync({
        userId: String(modalUserId),
        date: selectedDate.toISOString(),
      });
    }

    // 3) Optional point adjustments (only if non-zero)
    const adjustments = [
      { label: "Nutrition", value: adjNutrition },
      { label: "Hydration", value: adjHydration },
      { label: "Movement", value: adjMovement },
      { label: "Scripture", value: adjScripture },
      { label: "Life Group", value: adjLifeGroup },
    ];

    for (const adj of adjustments) {
      const delta = Number(adj.value || "0");
      if (!Number.isFinite(delta) || delta === 0) continue;

      await adjustPointsMutation.mutateAsync({
        userId: String(modalUserId),
        dateISO: selectedDate.toISOString(),
        pointsDelta: delta,
        reason: `Admin adjustment: ${adj.label}`,
        category: adj.label,
      });
    }

    // 4) Refresh UI + close modal
    await refetch();
    await refetchAttendance();

    // refresh leaderboard (you can include day too if you want)
    await utils.metrics.getGroupLeaderboard.invalidate({ period: "day" });
    await utils.metrics.getGroupLeaderboard.invalidate({ period: "week" });
    await utils.metrics.getGroupLeaderboard.invalidate({ period: "overall" });

    setShowAddModal(false);
    setModalUserId(null);
  } catch (error: any) {
    console.error("handleAddCheckin failed:", error);
    Alert.alert("Error", error?.message || "Failed to submit check-in.");
  }
};

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
    setAdjNutrition("0");
    setAdjHydration("0");
    setAdjMovement("0");
    setAdjScripture("0");
    setAdjLifeGroup("0");
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
  <Modal
    transparent
    animationType="fade"
    visible={showEditModal}
    onRequestClose={() => setShowEditModal(false)}
  >
    <View className="flex-1 bg-black/50 items-center justify-center p-4">
      <View
        className="w-full max-w-xl bg-white rounded-2xl overflow-hidden"
        style={{ maxHeight: "90%" as any }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-xl font-bold mb-2">Edit Check-In</Text>
          <Text className="text-sm text-muted mb-4">{editUserName}</Text>

          <View className="gap-3">
            <TouchableOpacity
              className="border border-border rounded-2xl p-4 bg-surface flex-row items-center justify-between"
              onPress={() => setEditNutrition((v) => !v)}
            >
              <Text className="text-base font-semibold text-foreground">🥗 Nutrition</Text>
              <Text className="text-sm font-bold text-foreground">{editNutrition ? "1" : "0"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="border border-border rounded-2xl p-4 bg-surface flex-row items-center justify-between"
              onPress={() => setEditHydration((v) => !v)}
            >
              <Text className="text-base font-semibold text-foreground">💧 Hydration</Text>
              <Text className="text-sm font-bold text-foreground">{editHydration ? "1" : "0"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="border border-border rounded-2xl p-4 bg-surface flex-row items-center justify-between"
              onPress={() => setEditMovement((v) => !v)}
            >
              <Text className="text-base font-semibold text-foreground">🏃 Movement</Text>
              <Text className="text-sm font-bold text-foreground">{editMovement ? "1" : "0"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="border border-border rounded-2xl p-4 bg-surface flex-row items-center justify-between"
              onPress={() => setEditScripture((v) => !v)}
            >
              <Text className="text-base font-semibold text-foreground">📖 Scripture</Text>
              <Text className="text-sm font-bold text-foreground">{editScripture ? "1" : "0"}</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-5">
            <Text className="text-base font-semibold text-foreground mb-2">
              Notes (optional)
            </Text>
            <TextInput
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Add notes..."
              multiline
              className="border border-border rounded-2xl p-4"
              style={{ minHeight: 90, textAlignVertical: "top" }}
            />
          </View>
        </ScrollView>

                <View className="flex-row gap-3 p-4 border-t border-border bg-white">
          <TouchableOpacity
            className="flex-1 p-4 rounded-2xl bg-gray-200"
            onPress={() => setShowEditModal(false)}
            disabled={isSavingEdit}
          >
            <Text className="text-center font-semibold">Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 p-4 rounded-2xl bg-primary"
            onPress={async () => {
              if (!selectedUserId) {
                Alert.alert("Error", "Missing user ID");
                return;
              }
              await upsertCheckInMutation.mutateAsync({
                userId: String(selectedUserId),
                dateISO: selectedDate.toISOString(),
                nutritionDone: editNutrition,
                hydrationDone: editHydration,
                movementDone: editMovement,
                scriptureDone: editScripture,
                notes: editNotes?.trim() ? editNotes.trim() : undefined,
              });
              setShowEditModal(false);
            }}
            disabled={isSavingEdit}
          >
            {isSavingEdit ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center font-semibold text-white">Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
)}
  
        {showAddModal && (
  <Modal
    transparent
    animationType="fade"
    visible={showAddModal}
    onRequestClose={() => setShowAddModal(false)}
  >
    <View className="flex-1 bg-black/50 items-center justify-center p-4">
      <View
        className="w-full max-w-xl bg-white rounded-2xl overflow-hidden"
        style={{ maxHeight: "90%" as any }}
      >
        {/* SCROLL AREA */}
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-xl font-bold mb-2">Add Check-In</Text>
          <Text className="text-sm text-muted mb-4">
            {modalUserName || "Selected user"}
          </Text>

          {/* Toggle cards */}
          <View className="gap-3">
            <TouchableOpacity
              className="border border-border rounded-2xl p-4 bg-surface flex-row items-center justify-between"
              onPress={() => setMNutrition((v) => !v)}
            >
              <Text className="text-base font-semibold text-foreground">🥗 Nutrition</Text>
              <Text className="text-sm font-bold text-foreground">{mNutrition ? "1" : "0"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="border border-border rounded-2xl p-4 bg-surface flex-row items-center justify-between"
              onPress={() => setMHydration((v) => !v)}
            >
              <Text className="text-base font-semibold text-foreground">💧 Hydration</Text>
              <Text className="text-sm font-bold text-foreground">{mHydration ? "1" : "0"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="border border-border rounded-2xl p-4 bg-surface flex-row items-center justify-between"
              onPress={() => setMMovement((v) => !v)}
            >
              <Text className="text-base font-semibold text-foreground">🏃 Movement</Text>
              <Text className="text-sm font-bold text-foreground">{mMovement ? "1" : "0"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="border border-border rounded-2xl p-4 bg-surface flex-row items-center justify-between"
              onPress={() => setMScripture((v) => !v)}
            >
              <Text className="text-base font-semibold text-foreground">📖 Scripture</Text>
              <Text className="text-sm font-bold text-foreground">{mScripture ? "1" : "0"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="border border-border rounded-2xl p-4 bg-surface flex-row items-center justify-between"
              onPress={() => setMLifeGroup((v) => !v)}
            >
              <Text className="text-base font-semibold text-foreground">👥 Life Group</Text>
              <Text className="text-sm font-bold text-foreground">{mLifeGroup ? "1" : "0"}</Text>
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View className="mt-5">
            <Text className="text-base font-semibold text-foreground mb-2">
              Notes (optional)
            </Text>
            <TextInput
              value={mNotes}
              onChangeText={setMNotes}
              placeholder="Add notes..."
              multiline
              className="border border-border rounded-2xl p-4"
              style={{ minHeight: 90, textAlignVertical: "top" }}
            />
          </View>

          {/* Optional adjustments */}
          <View className="mt-6">
            <Text className="text-base font-semibold text-foreground mb-2">
              Point Adjustments (optional)
            </Text>
            <Text className="text-xs text-muted mb-3">
              Use + / - values (example: 1, -1). Leave 0 for none.
            </Text>

            <View className="gap-3">
              {[
                { label: "Nutrition", value: adjNutrition, setValue: setAdjNutrition },
                { label: "Hydration", value: adjHydration, setValue: setAdjHydration },
                { label: "Movement", value: adjMovement, setValue: setAdjMovement },
                { label: "Scripture", value: adjScripture, setValue: setAdjScripture },
                { label: "Life Group", value: adjLifeGroup, setValue: setAdjLifeGroup },
              ].map((row) => (
                <View
                  key={row.label}
                  className="border border-border rounded-2xl p-4 bg-surface flex-row items-center justify-between"
                >
                  <Text className="text-sm font-semibold text-foreground">{row.label}</Text>
                  <TextInput
                    value={row.value}
                    onChangeText={row.setValue}
                    keyboardType="numeric"
                    className="border border-border rounded-xl px-3 py-2"
                    style={{ width: 90 }}
                  />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* FIXED FOOTER (always visible) */}
                        {/* FIXED FOOTER (always visible) */}
                {/* FIXED FOOTER (always visible) */}
        <View className="flex-row gap-3 p-4 border-t border-border bg-white">
          <TouchableOpacity
            className="flex-1 p-4 rounded-2xl bg-gray-200"
            onPress={() => setShowAddModal(false)}
            disabled={isSubmittingAdd}
          >
            <Text className="text-center font-semibold">Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 p-4 rounded-2xl bg-primary"
            onPress={handleAddCheckin}
            disabled={isSubmittingAdd}
          >
            {isSubmittingAdd ? (
              <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center font-semibold text-white">Submit</Text>
                )}
              </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScreenContainer>
  );
}
