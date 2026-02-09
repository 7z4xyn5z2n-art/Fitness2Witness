import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

type PostType = "Encouragement" | "Testimony" | "Photo" | "Video" | "Announcement";

export default function CreatePostScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [postType, setPostType] = useState<PostType>("Encouragement");
  const [postText, setPostText] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");

  const createPostMutation = trpc.community.createPost.useMutation({
    onSuccess: () => {
      utils.community.getPosts.invalidate();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Success", "Post created successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need camera roll permissions to select photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!postText.trim() && !imageUri && !videoUrl.trim()) {
      Alert.alert("Empty Post", "Please add some content to your post.");
      return;
    }

    createPostMutation.mutate({
      postType,
      postText: postText.trim() || undefined,
      postImageBase64: imageUri ? imageUri.split(",")[1] : undefined,
      postVideoUrl: videoUrl.trim() || undefined,
      visibility: "GroupOnly",
    });
  };

  const postTypes: PostType[] = ["Encouragement", "Testimony", "Photo", "Video", "Announcement"];

  return (
    <ScreenContainer className="p-6">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-6">
            {/* Header */}
            <View>
              <TouchableOpacity onPress={() => router.back()} className="mb-4">
                <Text className="text-primary text-base">← Back</Text>
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-foreground">Create Post</Text>
              <Text className="text-base text-muted mt-2">Share with your group</Text>
            </View>

            {/* Post Type Selector */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-sm font-semibold text-foreground mb-3">Post Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {postTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => {
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setPostType(type);
                      }}
                      className={`px-4 py-2 rounded-full border-2 ${
                        postType === type ? "border-primary bg-primary/10" : "border-border"
                      }`}
                    >
                      <Text className={`font-semibold ${postType === type ? "text-primary" : "text-muted"}`}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Text Input */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <TextInput
                className="text-foreground text-base min-h-[120px]"
                placeholder="What's on your mind? Share encouragement, testimony, or prayer request..."
                placeholderTextColor="#9BA1A6"
                multiline
                value={postText}
                onChangeText={setPostText}
                returnKeyType="done"
              />
            </View>

            {/* Emoji Quick Access */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-sm font-semibold text-foreground mb-3">Quick Emojis</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-3">
                  {["🙏", "💪", "❤️", "🔥", "✨", "🎉", "👏", "💯", "🌟", "😊"].map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => {
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setPostText((prev) => prev + emoji);
                      }}
                      className="w-12 h-12 items-center justify-center bg-background rounded-full"
                    >
                      <Text className="text-2xl">{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Image Upload */}
            {(postType === "Photo" || postType === "Testimony" || postType === "Encouragement") && (
              <View className="bg-surface rounded-2xl p-4 border border-border">
                <Text className="text-sm font-semibold text-foreground mb-3">Add Photo (Optional)</Text>
                {imageUri ? (
                  <View>
                    <Image source={{ uri: imageUri }} className="w-full h-48 rounded-xl mb-3" resizeMode="cover" />
                    <TouchableOpacity
                      onPress={() => setImageUri(null)}
                      className="bg-error px-4 py-2 rounded-full self-center"
                    >
                      <Text className="text-background font-semibold">Remove Photo</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={pickImage}
                    className="border-2 border-dashed border-border rounded-xl p-6 items-center"
                  >
                    <Text className="text-4xl mb-2">📷</Text>
                    <Text className="text-primary font-semibold">Select Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Video URL */}
            {postType === "Video" && (
              <View className="bg-surface rounded-2xl p-4 border border-border">
                <Text className="text-sm font-semibold text-foreground mb-3">Video URL</Text>
                <TextInput
                  className="text-foreground text-base p-3 bg-background rounded-xl"
                  placeholder="Paste YouTube or Vimeo link..."
                  placeholderTextColor="#9BA1A6"
                  value={videoUrl}
                  onChangeText={setVideoUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={createPostMutation.isPending}
              className="bg-primary px-6 py-4 rounded-full active:opacity-80"
            >
              {createPostMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-background text-center font-semibold text-lg">Post to Community</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
