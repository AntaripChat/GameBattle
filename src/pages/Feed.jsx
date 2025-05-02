import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc,
  getDoc,
  serverTimestamp,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { FaHeart, FaPaperPlane, FaUser, FaRedo, FaTrash } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [firestoreReady, setFirestoreReady] = useState(false);

  // 1. First verify Firestore connection
  useEffect(() => {
    const verifyFirestore = async () => {
      try {
        console.log("[Firestore] Verifying connection...");
        const testDocRef = doc(db, "_connection_test", "feed");
        await setDoc(testDocRef, { 
          test: "connection_check",
          timestamp: serverTimestamp() 
        }, { merge: true });
        
        const docSnap = await getDoc(testDocRef);
        if (!docSnap.exists()) {
          throw new Error("Test document not found");
        }
        
        console.log("[Firestore] Connection verified");
        setFirestoreReady(true);
        setError(null);
      } catch (err) {
        console.error("[Firestore] Connection failed:", err);
        setError("Failed to connect to database. Please check your internet connection.");
        setLoading(false);
      }
    };

    verifyFirestore();
  }, []);

  // 2. Load posts after Firestore is verified
  useEffect(() => {
    if (!firestoreReady) return;

    let unsubscribe;
    const initFeed = async () => {
      try {
        setLoading(true);
        console.log("[Feed] Initializing...");
        
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        
        unsubscribe = onSnapshot(
          q,
          async (snapshot) => {
            try {
              console.log(`[Feed] Received ${snapshot.docs.length} posts`);
              
              const postsData = await Promise.all(
                snapshot.docs.map(async (doc) => {
                  const data = doc.data();
                  let userName = data.userName || "Anonymous";
                  let userProfileLink = "#";
                  
                  if (data.userId) {
                    try {
                      const userDoc = await getDoc(doc(db, "users", data.userId));
                      if (userDoc.exists()) {
                        userName = userDoc.data().name || data.userName || "Anonymous";
                        userProfileLink = `/profile/${data.userId}`;
                      }
                    } catch (userErr) {
                      console.warn(`[Feed] Couldn't fetch user ${data.userId}:`, userErr);
                    }
                  }
                  
                  return {
                    id: doc.id,
                    ...data,
                    userName,
                    userProfileLink,
                    createdAt: data.createdAt?.toDate() || new Date()
                  };
                })
              );
              
              setPosts(postsData);
              setError(null);
            } catch (processingErr) {
              console.error("[Feed] Error processing posts:", processingErr);
              setError("Failed to process posts");
            }
          },
          (error) => {
            console.error("[Feed] Listener error:", error);
            setError("Connection to feed interrupted");
          }
        );

        console.log("[Feed] Initialized successfully");
      } catch (initErr) {
        console.error("[Feed] Initialization failed:", initErr);
        setError("Failed to initialize feed");
      } finally {
        setLoading(false);
      }
    };

    initFeed();

    return () => {
      if (unsubscribe) {
        console.log("[Feed] Cleaning up listener");
        unsubscribe();
      }
    };
  }, [firestoreReady]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || !user) return;

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userName = userDoc.exists() ? userDoc.data().name || "Anonymous" : "Anonymous";

      await addDoc(collection(db, "posts"), {
        content: newPost,
        userId: user.uid,
        userName,
        likes: [],
        createdAt: serverTimestamp()
      });
      setNewPost("");
      setError(null);
    } catch (err) {
      console.error("[Post] Error:", err);
      setError("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId, currentLikes = []) => {
    if (!user) return;
    
    try {
      const postRef = doc(db, "posts", postId);
      const updatedLikes = currentLikes.includes(user.uid)
        ? currentLikes.filter((uid) => uid !== user.uid)
        : [...currentLikes, user.uid];

      await updateDoc(postRef, { likes: updatedLikes });
    } catch (err) {
      console.error("[Like] Error:", err);
      setError("Failed to update like");
    }
  };

  const handleDeletePost = async (postId, postUserId) => {
    if (!user || user.uid !== postUserId) return;
    
    try {
      const confirmDelete = window.confirm("Are you sure you want to delete this post?");
      if (!confirmDelete) return;
      
      await deleteDoc(doc(db, "posts", postId));
      setError(null);
    } catch (err) {
      console.error("[Delete] Error:", err);
      setError("Failed to delete post");
    }
  };

  const retryConnection = () => {
    setError(null);
    setLoading(true);
    setFirestoreReady(false);
  };

  if (!firestoreReady || (loading && posts.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          {error ? (
            <>
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-white mb-2">Connection Error</h3>
              <p className="text-gray-300 mb-6">{error}</p>
              <button
                onClick={retryConnection}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 mx-auto"
              >
                <FaRedo /> Retry Connection
              </button>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-white mb-2">Loading Feed</h3>
              <p className="text-gray-300">Connecting to database...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6 lg:p-8 pt-24 sm:pt-28 lg:pt-32">
      <div className="max-w-2xl mx-auto">
        {error && (
          <motion.div 
            className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg mb-6 flex justify-between items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-white hover:text-gray-300 text-lg"
            >
              ×
            </button>
          </motion.div>
        )}

        {user && (
          <motion.div 
            className="bg-gray-900 rounded-xl p-6 mb-6 border border-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <form onSubmit={handlePostSubmit} className="space-y-4">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="What's happening?"
                rows={3}
                disabled={loading}
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <span className={`text-sm ${
                  newPost.length > 450 ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {newPost.length}/500
                </span>
                <motion.button
                  type="submit"
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  disabled={!newPost.trim() || loading}
                >
                  {loading ? (
                    <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <FaPaperPlane /> Post
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="space-y-6">
          <AnimatePresence>
            {posts.length > 0 ? (
              posts.map((post) => (
                <motion.div
                  key={post.id}
                  className="bg-gray-900 rounded-xl p-6 border border-gray-800"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <Link 
                      to={post.userProfileLink}
                      className="bg-indigo-500/20 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
                    >
                      <span className="text-indigo-400 font-bold">
                        {post.userName.charAt(0).toUpperCase()}
                      </span>
                    </Link>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link 
                            to={post.userProfileLink}
                            className="font-bold text-white hover:text-indigo-400"
                          >
                            {post.userName}
                          </Link>
                          <p className="text-sm text-gray-400">
                            {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                        {user?.uid === post.userId && (
                          <button
                            onClick={() => handleDeletePost(post.id, post.userId)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete post"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-200 mb-4 whitespace-pre-line">{post.content}</p>
                  
                  <div className="flex gap-6 pt-4 border-t border-gray-800">
                    <button
                      onClick={() => handleLike(post.id, post.likes || [])}
                      className={`flex items-center gap-2 ${
                        post.likes?.includes(user?.uid) ? "text-red-500" : "text-gray-400"
                      } hover:text-red-500 transition-colors`}
                      disabled={!user}
                      title={user ? "" : "Sign in to like"}
                    >
                      <FaHeart /> {post.likes?.length || 0}
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                className="text-center py-16 text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-800 rounded-full mb-6">
                  <FaUser className="text-3xl opacity-70" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  No Posts Yet
                </h3>
                <p className="text-gray-400 mb-5 max-w-md mx-auto">
                  {user ? "Be the first to post something!" : "Sign in to view and create posts"}
                </p>
                {!user && (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-lg transition-all"
                  >
                    Sign In
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}