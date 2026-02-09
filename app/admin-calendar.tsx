import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View, TextInput } from "react-native";
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

  const addCheckInMutation = trpc.admin.addUserCheckIn.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Check-in added successfully");
      refetch();
      setEditMode(false);
      setSelectedUserId(null);
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const addAttendanceMutation = trpc.admin.addUserAttendance.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Attendance recorded successfully");
      refetchAttendance();
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleAddCheckIn = (userId: string) => {
    Alert.alert(
      "Add Check-In",
      "Add a full check-in (all 4 categories) for this user?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: () => {
            addCheckInMutation.mutate({
              userId,
              date: selectedDate.toISOString(),
              nutritionDone: true,
              hydrationDone: true,
              movementDone: true,
              scriptureDone: true,
              notes: "Added by admin",
            });
          },
        },
      ]
    );
  };

  const handleAddAttendance = (userId: string) => {
    addAttendanceMutation.mutate({
      userId,
      date: selectedDate.toISOString(),
      attended: true,
    });
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
          </View>

          {/* Check-Ins Summary */}
          <View className="bg-surface rounded-2xl p-4 shadow-sm border border-border">
            <Text className="text-lg font-bold text-foreground mb-3">Daily Check-Ins</Text>
            {checkInsLoading ? (
              <ActivityIndicator />
            ) : checkIns && checkIns.length > 0 ? (
              <View className="gap-2">
                {checkIns.map((checkIn: any) => (
                  <View key={checkIn.id} className="p-3 bg-background rounded-xl border border-border">
                    <Text className="text-sm font-semibold text-foreground">{checkIn.user.name}</Text>
                    <Text className="text-xs text-muted mt-1">
                      Points: {[checkIn.nutritionDone, checkIn.hydrationDone, checkIn.movementDone, checkIn.scriptureDone].filter(Boolean).length}/4
                    </Text>
                  </View>
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
              {users?.map((user: any) => (
                <TouchableOpacity
                  key={user.id}
                  onPress={() => handleAddCheckIn(user.id)}
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
              {users?.map((user: any) => {
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
    </ScreenContainer>
  );
}
