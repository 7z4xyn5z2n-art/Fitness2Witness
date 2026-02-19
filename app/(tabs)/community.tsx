import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View, RefreshControl, Image } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useLocalSearchParams, useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";

export default function CommunityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [didPrompt, setDidPrompt] = useState(false);

  useEffect(() => {
    if (didPrompt) return;
    if (params?.promptShare === "1") {
      setDidPrompt(true);
      Alert.alert(
        "Share your progress",
        "Want to post to the community and encourage others?",
        [
          { text: "Not now", style: "cancel", onPress: () => {} },
          { text: "Create Post", onPress: () => router.push("/create-post") },
        ]
      );
    }
  }, [params, didPrompt]);
  
  const { data: posts, isLoading, refetch } = trpc.community.getPosts.useQuery();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 gap-6">
        {/* Header */}
        <View className="gap-4">
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">Community Feed</Text>
            <Text className="text-base text-muted">Share and encourage each other</Text>
          </View>

          {/* Create Post Button */}
          <TouchableOpacity
            onPress={() => router.push("/create-post")}
            className="bg-primary px-6 py-3 rounded-full active:opacity-80"
          >
            <Text className="text-background text-center font-semibold">✏️ Create Post</Text>
          </TouchableOpacity>
        </View>

        {/* Posts List */}
        {isLoading && !posts ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
            <Text className="text-base text-muted mt-4">Loading posts...</Text>
          </View>
        ) : (
          <FlatList
            data={posts || []}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item }) => (
              <View className="bg-surface rounded-2xl p-4 mb-3 border border-border">
                {/* Post Header */}
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
                    <Text className="text-background font-bold">{item.authorName?.[0] || "?"}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">{item.authorName}</Text>
                    <Text className="text-xs text-muted">{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                  {item.isPinned && (
                    <View className="bg-warning/20 px-2 py-1 rounded">
                      <Text className="text-xs text-warning font-semibold">📌 Pinned</Text>
                    </View>
                  )}
                </View>

                {/* Post Type Badge */}
                <View className="mb-2">
                  <View className="bg-primary/10 px-3 py-1 rounded-full self-start">
                    <Text className="text-xs text-primary font-semibold">{item.postType}</Text>
                  </View>
                </View>

                {/* Post Content */}
                {item.postText && <Text className="text-base text-foreground mb-3">{item.postText}</Text>}

               {/* Post Image */}
              {item.postImageUrl && (
                <Image
                  source={{ uri: item.postImageUrl }}
                  style={{ width: "100%", height: 240, borderRadius: 12, marginBottom: 12 }}
                  resizeMode="cover"
                />
              )}

                {/* Post Video */}
                {item.postVideoUrl && (
                  <View className="bg-border rounded-xl h-48 items-center justify-center mb-3">
                    <Text className="text-muted">🎥 Video</Text>
                  </View>
                )}

                {/* Footer */}
                <View className="mt-2 pt-2 border-t border-border">
                  <Text className="text-xs text-muted">💬 Tap to view and comment</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Text className="text-xl font-semibold text-muted">No posts yet</Text>
                <Text className="text-sm text-muted mt-2">Be the first to share!</Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}
