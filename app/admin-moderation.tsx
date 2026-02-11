import { ScrollView, Text, View, TouchableOpacity, Alert, RefreshControl } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function ContentModerationScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  const { data: posts, refetch: refetchPosts } = trpc.community.getPosts.useQuery();
  const utils = trpc.useUtils();
  const deletePostMutation = trpc.community.deletePost.useMutation({
    onSuccess: () => {
      utils.community.getPosts.invalidate();
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchPosts();
    setRefreshing(false);
  };

  const handleDeletePost = (postId: number, postText: string) => {
    Alert.alert(
      "Delete Post",
      `Are you sure you want to delete this post?\n\n"${postText?.substring(0, 100)}..."`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePostMutation.mutateAsync({ postId });
              Alert.alert("Success", "Post deleted successfully");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete post");
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-3xl font-bold text-foreground mb-2">Content Moderation</Text>
            <Text className="text-base text-muted">Review and manage community posts</Text>
          </View>
        </View>

        {/* Stats Card */}
        <View className="bg-surface rounded-xl p-4 mb-6" style={{ borderWidth: 1, borderColor: colors.border }}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-muted mb-1">Total Posts</Text>
              <Text className="text-3xl font-bold text-foreground">{posts?.length || 0}</Text>
            </View>
            <Text className="text-4xl">🛡️</Text>
          </View>
        </View>

        {/* Posts List */}
        <View>
          <Text className="text-xl font-bold text-foreground mb-4">All Posts</Text>

          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <View
                key={post.id}
                className="bg-surface rounded-xl p-4 mb-3"
                style={{ borderWidth: 1, borderColor: colors.border }}
              >
                {/* Post Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {(post as any).authorName}
                    </Text>
                    <Text className="text-xs text-muted">
                      {new Date(post.createdAt).toLocaleDateString()} at{" "}
                      {new Date(post.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                  <View className="px-3 py-1 rounded-full bg-primary/10">
                    <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                      {post.postType}
                    </Text>
                  </View>
                </View>

                {/* Post Content */}
                {post.postText && (
                  <Text className="text-sm text-foreground mb-3" numberOfLines={5}>
                    {post.postText}
                  </Text>
                )}

                {post.postImageUrl && (
                  <View className="bg-primary/5 rounded-lg p-3 mb-3">
                    <Text className="text-xs text-muted">📷 Image attached</Text>
                  </View>
                )}

                {post.postVideoUrl && (
                  <View className="bg-primary/5 rounded-lg p-3 mb-3">
                    <Text className="text-xs text-muted">🎥 Video attached</Text>
                  </View>
                )}

                {/* Post Metadata */}
                <View className="flex-row gap-4 mb-3 p-2 bg-background rounded-lg">
                  <View className="flex-1">
                    <Text className="text-xs text-muted">Visibility</Text>
                    <Text className="text-sm font-semibold text-foreground">{post.visibility}</Text>
                  </View>
                  {post.isPinned && (
                    <View className="flex-1">
                      <Text className="text-xs text-muted">Status</Text>
                      <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                        📌 Pinned
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => router.push(`/post-detail?postId=${post.id}` as any)}
                    className="flex-1 bg-primary/10 py-2 rounded-lg"
                  >
                    <Text className="text-center text-sm font-semibold" style={{ color: colors.primary }}>
                      View Details
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeletePost(post.id, post.postText || "")}
                    className="flex-1 bg-error/10 py-2 rounded-lg"
                  >
                    <Text className="text-center text-sm font-semibold text-error">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-surface rounded-xl p-8 items-center">
              <Text className="text-5xl mb-4">📭</Text>
              <Text className="text-lg font-semibold text-foreground mb-2">No Posts Yet</Text>
              <Text className="text-sm text-muted text-center">
                Community posts will appear here for moderation
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
