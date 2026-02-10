import { ActivityIndicator, FlatList, Text, TouchableOpacity, View, RefreshControl } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";

import { useRouter } from "expo-router";

export default function CommunityScreen() {
  const router = useRouter();
  const posts: any[] = [];
  const isLoading = false;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
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
            onPress={() => router.push("/create-post" as any)}
            className="bg-primary px-6 py-3 rounded-full active:opacity-80"
          >
            <Text className="text-background text-center font-semibold">✏️ Create Post</Text>
          </TouchableOpacity>
        </View>

        {/* Posts List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push(`/post/${item.id}` as any)}
                className="bg-surface rounded-2xl p-4 mb-3 border border-border active:opacity-80"
              >
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
                  <View className="bg-border rounded-xl h-48 items-center justify-center mb-3">
                    <Text className="text-muted">🖼️ Image</Text>
                  </View>
                )}

                {/* Post Video */}
                {item.postVideoUrl && (
                  <View className="bg-border rounded-xl h-48 items-center justify-center mb-3">
                    <Text className="text-muted">🎥 Video</Text>
                  </View>
                )}

                {/* Comment Count */}
                <View className="mt-2 pt-2 border-t border-border">
                  <Text className="text-xs text-muted">💬 Tap to view and comment</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Text className="text-muted text-center">No posts yet. Be the first to share!</Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}
