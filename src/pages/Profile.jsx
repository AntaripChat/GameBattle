import { useState, useEffect, memo } from "react";
import { auth, db, realtimeDb } from "../services/firebase";
import { updatePassword, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, remove, set } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserEdit,
  FaLock,
  FaGamepad,
  FaTrophy,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCheck,
  FaSignOutAlt,
  FaHeart,
  FaPaperPlane,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const games = [
  "PUBG Mobile",
  "Free Fire",
  "Call of Duty: Mobile",
  "Battlegrounds Mobile India (BGMI)",
  "Clash of Clans",
  "Clash Royale",
  "Ludo King",
  "Garena Free Fire",
  "Asphalt 9: Legends",
  "Candy Crush Saga",
  "Among Us",
  "Subway Surfers",
  "Minecraft",
  "Fortnite",
  "Apex Legends",
  "Valorant",
  "FIFA Online 4",
  "League of Legends",
  "Counter-Strike: Global Offensive (CS: GO)",
  "Rocket League",
];

// Reusable Challenge Card Component
const ChallengeCard = memo(
  ({
    challenge,
    isEditing,
    onEdit,
    onDelete,
    onUpdate,
    onCancelEdit,
    editedGameName,
    setEditedGameName,
    editedPrize,
    setEditedPrize,
    isAccepted,
    onCancelAcceptance,
  }) => {
    return (
      <motion.div
        className="relative bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 hover:border-indigo-500 transition-all duration-300 overflow-hidden"
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
      >
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Game Name
              </label>
              <select
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                value={editedGameName}
                onChange={(e) => setEditedGameName(e.target.value)}
              >
                {games.map((game) => (
                  <option key={game} value={game} className="bg-gray-800 text-white">
                    {game}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prize Amount ($)
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                value={editedPrize}
                onChange={(e) => setEditedPrize(e.target.value)}
                placeholder="Prize amount"
              />
            </div>
            <div className="flex gap-3">
              <motion.button
                onClick={() => onUpdate(challenge.id)}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FaCheck /> Save
              </motion.button>
              <motion.button
                onClick={onCancelEdit}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-600 transition-all shadow-md"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FaTimes /> Cancel
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="absolute top-4 right-4 flex gap-2">
              {!isAccepted && (
                <>
                  <motion.button
                    onClick={() => onEdit(challenge)}
                    className="text-gray-400 hover:text-blue-400 p-1.5 rounded-full hover:bg-gray-800 transition-colors"
                    title="Edit"
                    whileHover={{ scale: 1.2 }}
                  >
                    <FaEdit size={16} />
                  </motion.button>
                  <motion.button
                    onClick={() => onDelete(challenge.id)}
                    className="text-gray-400 hover:text-red-400 p-1.5 rounded-full hover:bg-gray-800 transition-colors"
                    title="Delete"
                    whileHover={{ scale: 1.2 }}
                  >
                    <FaTrash size={16} />
                  </motion.button>
                </>
              )}
              {isAccepted && (
                <motion.button
                  onClick={() => onCancelAcceptance(challenge.id)}
                  className="text-gray-400 hover:text-red-400 p-1.5 rounded-full hover:bg-gray-800 transition-colors"
                  title="Withdraw from challenge"
                  whileHover={{ scale: 1.2 }}
                >
                  <FaTimes size={16} />
                </motion.button>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-2 pr-8">
              {challenge.gameName}
            </h3>
            <p className="text-indigo-400 font-bold text-2xl mb-3">
              ${Number(challenge.prize).toLocaleString()}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              {formatDistanceToNow(challenge.createdAt, { addSuffix: true })}
            </p>
            <div className="flex justify-between items-center pt-4 border-t border-gray-800">
              <span className="text-sm text-gray-300">
                {isAccepted ? (
                  <span>
                    Created by:{" "}
                    <span className="text-indigo-400">
                      {challenge.userName || "Anonymous"}
                    </span>
                  </span>
                ) : (
                  `${challenge.acceptedBy?.length || 0} accepted`
                )}
              </span>
              <Link
                to={`/messages?challengeId=${challenge.id}`}
                className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                View Messages
              </Link>
            </div>
          </>
        )}
      </motion.div>
    );
  }
);

// Post Card Component with delete option
const PostCard = memo(({ post, onLike, onDelete, user }) => {
  return (
    <motion.div
      className="relative bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-indigo-500 transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      {user?.uid === post.userId && (
        <button
          onClick={() => onDelete(post.id)}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete post"
        >
          <FaTrash size={16} />
        </button>
      )}
      
      <div className="flex items-start gap-4 mb-4">
        <div className="bg-indigo-500/20 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
          <span className="text-indigo-400 font-bold">
            {post.userName?.charAt(0).toUpperCase() || "U"}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-bold text-white">{post.userName || "Anonymous"}</span>
              <p className="text-sm text-gray-400">
                {formatDistanceToNow(post.createdAt, { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-gray-200 mb-4 whitespace-pre-line">{post.content}</p>
      
      <div className="flex gap-6 pt-4 border-t border-gray-800">
        <button
          onClick={() => onLike(post.id, post.likes || [])}
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
  );
});

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [createdChallenges, setCreatedChallenges] = useState([]);
  const [acceptedChallenges, setAcceptedChallenges] = useState([]);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [activeTab, setActiveTab] = useState("created");
  const [editingChallengeId, setEditingChallengeId] = useState(null);
  const [editedGameName, setEditedGameName] = useState("");
  const [editedPrize, setEditedPrize] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || "");
          setUsername(data.username || "");
          setProfilePic(
            `https://api.dicebear.com/7.x/identicon/svg?seed=${
              data.username || user.uid
            }&backgroundType=gradientLinear&backgroundColor=b6e3f4,c0aede,d1d4f9`
          );
        }
      }
    };
    fetchUser();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "challenges"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const challenges = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        }));
        setCreatedChallenges(challenges);
      },
      (error) => {
        console.error("Error fetching created challenges:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "challenges"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const challenges = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
          }))
          .filter((challenge) =>
            challenge.acceptedBy?.some((entry) => entry.userId === user.uid)
          );
        setAcceptedChallenges(challenges);
      },
      (error) => {
        console.error("Error fetching accepted challenges:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "posts"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleUpdate = async () => {
    if (!name || !username) {
      alert("Name and Username are required!");
      return;
    }
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name,
        username,
      });
      setProfilePic(
        `https://api.dicebear.com/7.x/identicon/svg?seed=${username || user.uid}`
      );
      alert("Profile updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) {
      alert("Enter a new password!");
      return;
    }
    try {
      await updatePassword(user, newPassword);
      alert("Password updated!");
      setNewPassword("");
    } catch (err) {
      console.error(err);
      alert("Failed to update password");
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (window.confirm("Are you sure you want to delete this challenge and all its messages?")) {
      try {
        await deleteDoc(doc(db, "challenges", challengeId));
        await remove(ref(realtimeDb, `challengeGroups/${challengeId}`));
        alert("Challenge deleted successfully");
      } catch (error) {
        console.error("Error deleting challenge:", error);
        alert("Failed to delete challenge");
      }
    }
  };

  const startEditing = (challenge) => {
    setEditingChallengeId(challenge.id);
    setEditedGameName(challenge.gameName);
    setEditedPrize(challenge.prize);
  };

  const cancelEditing = () => {
    setEditingChallengeId(null);
    setEditedGameName("");
    setEditedPrize("");
  };

  const handleUpdateChallenge = async (challengeId) => {
    if (!editedGameName || !editedPrize) {
      alert("Please fill in all fields");
      return;
    }

    try {
      await updateDoc(doc(db, "challenges", challengeId), {
        gameName: editedGameName,
        prize: editedPrize,
      });

      await set(
        ref(realtimeDb, `challengeGroups/${challengeId}/gameName`),
        editedGameName
      );

      setEditingChallengeId(null);
      alert("Challenge updated successfully");
    } catch (error) {
      console.error("Error updating challenge:", error);
      alert("Failed to update challenge");
    }
  };

  const cancelAcceptance = async (challengeId) => {
    if (window.confirm("Are you sure you want to withdraw from this challenge?")) {
      try {
        const challengeRef = doc(db, "challenges", challengeId);
        const challengeDoc = await getDoc(challengeRef);
        const currentAcceptedBy = challengeDoc.data().acceptedBy || [];

        await updateDoc(challengeRef, {
          acceptedBy: currentAcceptedBy.filter(
            (entry) => entry.userId !== user.uid
          ),
        });

        alert("You've withdrawn from this challenge");
      } catch (error) {
        console.error("Error canceling acceptance:", error);
        alert("Failed to withdraw from challenge");
      }
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || !user) return;

    try {
      await addDoc(collection(db, "posts"), {
        content: newPost,
        userId: user.uid,
        userName: name || username || "Anonymous",
        likes: [],
        createdAt: serverTimestamp(),
      });
      setNewPost("");
    } catch (err) {
      console.error("[Post] Error:", err);
      alert("Failed to create post");
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
      alert("Failed to update like");
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deleteDoc(doc(db, "posts", postId));
      } catch (err) {
        console.error("[Delete Post] Error:", err);
        alert("Failed to delete post");
      }
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-950 p-4 sm:p-6 lg:p-8 pt-24 sm:pt-28 lg:pt-32"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Profile Section */}
        <motion.div
          className="bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-800"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
            <motion.div
              className="relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={profilePic}
                alt="Profile"
                className="rounded-full w-24 h-24 sm:w-32 sm:h-32 ring-4 ring-indigo-500/50 shadow-lg"
              />
              <div className="absolute inset-0 rounded-full border-2 border-indigo-400/30 pointer-events-none"></div>
            </motion.div>
            <div className="flex-1 w-full space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {name || username || "User Profile"}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <motion.input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 transition-all"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    whileFocus={{ scale: 1.01 }}
                    aria-label="Username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <motion.input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    whileFocus={{ scale: 1.01 }}
                    aria-label="Full name"
                  />
                </div>
              </div>
              <motion.button
                onClick={handleUpdate}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-lg transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                aria-label="Update profile"
              >
                <FaUserEdit className="w-5 h-5" />
                Update Profile
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Post Section */}
        <motion.div
          className="bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-800"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3 className="text-xl font-semibold text-white mb-5">Your Posts</h3>
          
          <form onSubmit={handlePostSubmit} className="mb-6">
            <div className="space-y-4">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Share your thoughts..."
                rows={3}
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
                  disabled={!newPost.trim()}
                >
                  <FaPaperPlane /> Post
                </motion.button>
              </div>
            </div>
          </form>

          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onLike={handleLike}
                  onDelete={handleDeletePost}
                  user={user}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>You haven't posted anything yet.</p>
            </div>
          )}
        </motion.div>

        {/* Challenges Section */}
        <motion.div
          className="bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-800"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex border-b border-gray-800 mb-8">
            <motion.button
              className={`flex-1 px-4 py-3 font-medium text-sm sm:text-base flex items-center justify-center gap-2 ${
                activeTab === "created"
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-gray-400 hover:text-white"
              } transition-colors`}
              onClick={() => setActiveTab("created")}
              whileHover={{ scale: 1.03 }}
            >
              <FaGamepad className="w-5 h-5" />
              Created ({createdChallenges.length})
            </motion.button>
            <motion.button
              className={`flex-1 px-4 py-3 font-medium text-sm sm:text-base flex items-center justify-center gap-2 ${
                activeTab === "accepted"
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-gray-400 hover:text-white"
              } transition-colors`}
              onClick={() => setActiveTab("accepted")}
              whileHover={{ scale: 1.03 }}
            >
              <FaTrophy className="w-5 h-5" />
              Accepted ({acceptedChallenges.length})
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "created" ? (
              <motion.div
                key="created"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {createdChallenges.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {createdChallenges.map((challenge) => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        isEditing={editingChallengeId === challenge.id}
                        onEdit={startEditing}
                        onDelete={handleDeleteChallenge}
                        onUpdate={handleUpdateChallenge}
                        onCancelEdit={cancelEditing}
                        editedGameName={editedGameName}
                        setEditedGameName={setEditedGameName}
                        editedPrize={editedPrize}
                        setEditedPrize={setEditedPrize}
                      />
                    ))}
                  </div>
                ) : (
                  <motion.div
                    className="text-center py-16 text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-800 rounded-full mb-6">
                      <FaGamepad className="text-3xl opacity-70" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">
                      No Challenges Created
                    </h3>
                    <p className="text-gray-400 mb-5 max-w-md mx-auto">
                      You haven't created any challenges yet. Start by creating your first challenge!
                    </p>
                    <Link
                      to="/post-challenge"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-lg transition-all"
                    >
                      Create Challenge
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="accepted"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {acceptedChallenges.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {acceptedChallenges.map((challenge) => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        isAccepted
                        onCancelAcceptance={cancelAcceptance}
                      />
                    ))}
                  </div>
                ) : (
                  <motion.div
                    className="text-center py-16 text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-800 rounded-full mb-6">
                      <FaTrophy className="text-3xl opacity-70" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">
                      No Challenges Accepted
                    </h3>
                    <p className="text-gray-400 mb-5 max-w-md mx-auto">
                      You haven't accepted any challenges yet. Browse available challenges to get started!
                    </p>
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-lg transition-all"
                    >
                      Browse Challenges
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}