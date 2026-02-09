import {
  ActivityIndicator,
  Alert,
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/hooks/use-auth";

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const postId = parseInt(id || "0", 10);

  const { data: post, isLoading: postLoading } = trpc.community.getPostById.useQuery({ postId });
  const { data: comments, isLoading: commentsLoading } = trpc.community.getComments.useQuery({ postId });

  const [commentText, setCommentText] = useState("");

  const createCommentMutation = trpc.community.addComment.useMutation({
    onSuccess: () => {
      utils.community.getComments.invalidate({ postId });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setCommentText("");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleSubmitComment = () => {
    if (!commentText.trim()) {
      Alert.alert("Empty Comment", "Please write something before posting.");
      return;
    }

    createCommentMutation.mutate({
      postId,
      commentText: commentText.trim(),
    });
  };

  if (postLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  if (!post) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-muted">Post not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary">← Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

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
            </View>

            {/* Post */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              {/* Post Header */}
              <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
                  <Text className="text-background font-bold">{post.authorName?.[0] || "?"}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">{post.authorName}</Text>
                  <Text className="text-xs text-muted">{new Date(post.createdAt).toLocaleDateString()}</Text>
                </View>
                {post.isPinned && (
                  <View className="bg-warning/20 px-2 py-1 rounded">
                    <Text className="text-xs text-warning font-semibold">📌 Pinned</Text>
                  </View>
                )}
              </View>

              {/* Post Type Badge */}
              <View className="mb-2">
                <View className="bg-primary/10 px-3 py-1 rounded-full self-start">
                  <Text className="text-xs text-primary font-semibold">{post.postType}</Text>
                </View>
              </View>

              {/* Post Content */}
              {post.postText && <Text className="text-base text-foreground mb-3">{post.postText}</Text>}

              {/* Post Image */}
              {post.postImageUrl && (
                <View className="bg-border rounded-xl h-48 items-center justify-center mb-3">
                  <Text className="text-muted">🖼️ Image</Text>
                </View>
              )}

              {/* Post Video */}
              {post.postVideoUrl && (
                <View className="bg-border rounded-xl h-48 items-center justify-center mb-3">
                  <Text className="text-muted">🎥 Video</Text>
                </View>
              )}
            </View>

            {/* Comments Section */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-4">
                Comments ({comments?.length || 0})
              </Text>

              {/* Comment Input */}
              <View className="mb-4">
                <TextInput
                  className="text-foreground text-base p-3 bg-background rounded-xl border border-border min-h-[80px]"
                  placeholder="Write a comment..."
                  placeholderTextColor="#9BA1A6"
                  multiline
                  value={commentText}
                  onChangeText={setCommentText}
                />
                <TouchableOpacity
                  onPress={handleSubmitComment}
                  disabled={createCommentMutation.isPending}
                  className="bg-primary px-4 py-2 rounded-full mt-2 self-end active:opacity-80"
                >
                  {createCommentMutation.isPending ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text className="text-background font-semibold">Post Comment</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Comments List */}
              {commentsLoading ? (
                <ActivityIndicator />
              ) : comments && comments.length > 0 ? (
                <View className="gap-3">
                  {comments.map((comment) => (
                    <View key={comment.id} className="bg-background rounded-xl p-3 border border-border">
                      <View className="flex-row items-center mb-2">
                        <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-2">
                          <Text className="text-background text-xs font-bold">{comment.authorName?.[0] || "?"}</Text>
                        </View>
                        <View>
                          <Text className="text-sm font-semibold text-foreground">{comment.authorName}</Text>
                          <Text className="text-xs text-muted">{new Date(comment.createdAt).toLocaleDateString()}</Text>
                        </View>
                      </View>
                      <Text className="text-sm text-foreground">{comment.commentText}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-muted text-center py-4">No comments yet. Be the first to comment!</Text>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
