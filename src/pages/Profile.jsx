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
        className="relative bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl transition-shadow duration-300"
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.2 }}
      >
        {isEditing ? (
          <div className="space-y-4">
            <select
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
              value={editedGameName}
              onChange={(e) => setEditedGameName(e.target.value)}
            >
              {games.map((game) => (
                <option key={game} value={game}>
                  {game}
                </option>
              ))}
            </select>
            <input
              type="number"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
              value={editedPrize}
              onChange={(e) => setEditedPrize(e.target.value)}
              placeholder="Prize amount"
            />
            <div className="flex gap-2">
              <motion.button
                onClick={() => onUpdate(challenge.id)}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaCheck /> Save
              </motion.button>
              <motion.button
                onClick={onCancelEdit}
                className="flex-1 bg-gray-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaTimes /> Cancel
              </motion.button>
            </div>
          </div>
        ) : (
          <>
            <div className="absolute top-3 right-3 flex gap-2">
              {!isAccepted && (
                <>
                  <motion.button
                    onClick={() => onEdit(challenge)}
                    className="text-gray-300 hover:text-blue-400 p-1"
                    title="Edit"
                    whileHover={{ scale: 1.2 }}
                  >
                    <FaEdit size={16} />
                  </motion.button>
                  <motion.button
                    onClick={() => onDelete(challenge.id)}
                    className="text-gray-300 hover:text-red-400 p-1"
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
                  className="text-gray-300 hover:text-red-400 p-1"
                  title="Withdraw from challenge"
                  whileHover={{ scale: 1.2 }}
                >
                  <FaTimes size={16} />
                </motion.button>
              )}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 pr-8">
              {challenge.gameName}
            </h3>
            <p className="text-indigo-400 font-bold text-lg mb-3">
              ${challenge.prize}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              {formatDistanceToNow(challenge.createdAt, { addSuffix: true })}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">
                {isAccepted
                  ? `Created by: ${challenge.userName || "Anonymous"}`
                  : `${challenge.acceptedBy?.length || 0} accepted`}
              </span>
              <Link
                to={`/messages?challengeId=${challenge.id}`}
                className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
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

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [createdChallenges, setCreatedChallenges] = useState([]);
  const [acceptedChallenges, setAcceptedChallenges] = useState([]);
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
            }`
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
        const challengeRef = doc(db, "challenges", challengeId); // Fixed typo
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

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-900 p-4 sm:p-6 lg:p-8 pt-24 sm:pt-28 lg:pt-32"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Profile Section */}
        <motion.div
          className="bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-700 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
            <motion.img
              src={profilePic}
              alt="Profile"
              className="rounded-full w-24 h-24 sm:w-32 sm:h-32 ring-4 ring-indigo-500 shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            />
            <div className="flex-1 w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {name || username || "User Profile"}
                </h2>
                {/* <motion.button
                  onClick={handleLogout}
                  className="text-gray-300 hover:text-red-400 flex items-center gap-2 text-sm font-medium"
                  whileHover={{ scale: 1.1 }}
                >
                  <FaSignOutAlt /> Logout
                </motion.button> */}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Username
                  </label>
                  <motion.input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400 transition-all"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    whileFocus={{ scale: 1.01 }}
                    aria-label="Username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Full Name
                  </label>
                  <motion.input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400 transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    whileFocus={{ scale: 1.01 }}
                    aria-label="Full name"
                  />
                </div>
              </div>
              <motion.button
                onClick={handleUpdate}
                className="mt-6 w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 shadow-md transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Update profile"
              >
                <FaUserEdit className="w-5 h-5" />
                Update Profile
              </motion.button>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Change Password
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  New Password
                </label>
                <motion.input
                  type="password"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400 transition-all"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  whileFocus={{ scale: 1.01 }}
                  aria-label="New password"
                />
              </div>
              <div className="flex items-end">
                <motion.button
                  onClick={handleChangePassword}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 shadow-md transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Update password"
                >
                  <FaLock className="w-5 h-5" />
                  Update Password
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Challenges Section */}
        <motion.div
          className="bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-700"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex border-b border-gray-700 mb-6">
            <motion.button
              className={`flex-1 px-4 py-3 font-medium text-sm sm:text-base ${
                activeTab === "created"
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("created")}
              whileHover={{ scale: 1.05 }}
            >
              <FaGamepad className="inline mr-2" />
              Created ({createdChallenges.length})
            </motion.button>
            <motion.button
              className={`flex-1 px-4 py-3 font-medium text-sm sm:text-base ${
                activeTab === "accepted"
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("accepted")}
              whileHover={{ scale: 1.05 }}
            >
              <FaTrophy className="inline mr-2" />
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
                  <div className="text-center py-12 text-gray-400">
                    <FaGamepad className="mx-auto text-5xl mb-4 opacity-50" />
                    <p className="text-lg">No challenges created yet.</p>
                    <Link
                      to="/post-challenge"
                      className="text-indigo-400 hover:text-indigo-300 mt-3 inline-block font-medium"
                    >
                      Create Your First Challenge
                    </Link>
                  </div>
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
                  <div className="text-center py-12 text-gray-400">
                    <FaTrophy className="mx-auto text-5xl mb-4 opacity-50" />
                    <p className="text-lg">No challenges accepted yet.</p>
                    <Link
                      to="/dashboard"
                      className="text-indigo-400 hover:text-indigo-300 mt-3 inline-block font-medium"
                    >
                      Browse Challenges
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}