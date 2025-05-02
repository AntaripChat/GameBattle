import { useEffect, useState, memo } from "react";
import { db, realtimeDb } from "../services/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { ref, remove, set } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { FaEdit, FaTrash, FaHeart, FaShare, FaSave, FaCheck, FaTimes, FaComments } from "react-icons/fa";
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
    user,
    isEditing,
    newGameName,
    setNewGameName,
    newPrize,
    setNewPrize,
    handleEdit,
    setEditId,
    handleDelete,
    handleLike,
    acceptChallenge,
    cancelAcceptance,
    shareChallenge,
  }) => {
    return (
      <motion.div
        className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 hover:border-indigo-500 transition-all duration-300 overflow-hidden"
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -5 }}
      >
        <div className="p-5">
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
                <motion.select
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white transition-all"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  aria-label="Select game name"
                  whileFocus={{ scale: 1.01 }}
                >
                  <option value="" disabled className="text-gray-400">
                    Select a game
                  </option>
                  {games.map((game) => (
                    <option key={game} value={game} className="bg-gray-800 text-white">
                      {game}
                    </option>
                  ))}
                </motion.select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prize Amount ($)
                </label>
                <motion.input
                  type="number"
                  value={newPrize}
                  onChange={(e) => setNewPrize(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white transition-all"
                  aria-label="Prize amount"
                  whileFocus={{ scale: 1.01 }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={() => handleEdit(challenge.id)}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FaSave className="w-4 h-4" />
                  Save
                </motion.button>
                <motion.button
                  onClick={() => setEditId(null)}
                  className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FaTimes className="w-4 h-4" />
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{challenge.gameName}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Posted by <span className="text-indigo-400">{challenge.userName}</span>
                  </p>
                </div>
                {challenge.userId === user?.uid && (
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => {
                        setEditId(challenge.id);
                        setNewGameName(challenge.gameName);
                        setNewPrize(challenge.prize);
                      }}
                      className="text-gray-400 hover:text-indigo-400 p-1 rounded-full hover:bg-gray-800 transition-colors"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label="Edit challenge"
                    >
                      <FaEdit className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      onClick={() => handleDelete(challenge.id)}
                      className="text-gray-400 hover:text-red-400 p-1 rounded-full hover:bg-gray-800 transition-colors"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label="Delete challenge"
                    >
                      <FaTrash className="w-5 h-5" />
                    </motion.button>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <p className="text-3xl font-bold text-indigo-400">
                  ${Number(challenge.prize).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Prize Pool</p>
              </div>

              <div className="mb-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Accepted by:</p>
                {challenge.acceptedBy?.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm text-gray-300 max-h-20 overflow-y-auto">
                    {challenge.acceptedBy.map((entry) => (
                      <li key={entry.userId} className="flex items-center">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                        <span className="truncate">{entry.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">No participants yet</p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-800">
                <p className="text-gray-400">
                  {formatDistanceToNow(challenge.createdAt, { addSuffix: true })}
                </p>
                <div className="flex items-center gap-4">
                  <motion.button
                    onClick={() => handleLike(challenge.id, challenge.likes)}
                    className={`flex items-center gap-1 ${
                      challenge.likes?.includes(user?.uid)
                        ? "text-red-500"
                        : "text-gray-400 hover:text-red-500"
                    } transition-colors`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Like challenge"
                  >
                    <FaHeart className="w-5 h-5" />
                    <span>{challenge.likes?.length || 0}</span>
                  </motion.button>
                  <motion.button
                    onClick={() => shareChallenge(challenge.gameName, challenge.prize)}
                    className="text-gray-400 hover:text-indigo-400 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Share challenge"
                  >
                    <FaShare className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {user && (
                <div className="mt-5 flex gap-3">
                  {challenge.userId === user.uid || challenge.acceptedBy?.some((entry) => entry.userId === user.uid) ? (
                    <Link
                      to="/messages"
                      state={{ challengeId: challenge.id }}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                      aria-label="View challenge messages"
                    >
                      <FaComments className="w-4 h-4" />
                      <span>Messages</span>
                    </Link>
                  ) : null}
                  {challenge.userId !== user.uid && (
                    challenge.acceptedBy?.some((entry) => entry.userId === user.uid) ? (
                      <motion.button
                        onClick={() => cancelAcceptance(challenge.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg transition-colors"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        aria-label="Cancel challenge acceptance"
                      >
                        <FaTimes className="w-4 h-4" />
                        <span>Cancel</span>
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={() => acceptChallenge(challenge.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        aria-label="Accept challenge"
                      >
                        <FaCheck className="w-4 h-4" />
                        <span>Accept</span>
                      </motion.button>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    );
  }
);

export default function Dashboard() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [editId, setEditId] = useState(null);
  const [newGameName, setNewGameName] = useState("");
  const [newPrize, setNewPrize] = useState("");

  useEffect(() => {
    const q = query(collection(db, "challenges"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const challengeData = [];
      for (const challengeDoc of snapshot.docs) {
        const challenge = {
          id: challengeDoc.id,
          ...challengeDoc.data(),
          createdAt: challengeDoc.data().createdAt?.toDate(),
        };

        let userName = "Anonymous";
        if (challenge.userId) {
          const userDocRef = doc(db, "users", challenge.userId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            userName = userDocSnap.data().name || "Anonymous";
          }
        }

        challengeData.push({
          ...challenge,
          userName,
        });
      }
      setChallenges(challengeData);
    }, (error) => {
      console.error("Error fetching challenges:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleLike = async (id, currentLikes = []) => {
    const updatedLikes = currentLikes.includes(user.uid)
      ? currentLikes.filter((uid) => uid !== user.uid)
      : [...currentLikes, user.uid];

    await updateDoc(doc(db, "challenges", id), { likes: updatedLikes });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this challenge and its group permanently?")) {
      try {
        await deleteDoc(doc(db, "challenges", id));
        await remove(ref(realtimeDb, `challengeGroups/${id}`));
      } catch (error) {
        console.error("Error deleting challenge:", error);
        alert("Failed to delete challenge");
      }
    }
  };

  const handleEdit = async (id) => {
    if (!newGameName || !newPrize) {
      alert("Please fill in all fields.");
      return;
    }
    try {
      await updateDoc(doc(db, "challenges", id), {
        gameName: newGameName,
        prize: newPrize,
      });
      await set(ref(realtimeDb, `challengeGroups/${id}/gameName`), newGameName);
      setEditId(null);
      setNewGameName("");
      setNewPrize("");
    } catch (error) {
      console.error("Error editing challenge:", error);
      alert("Failed to edit challenge");
    }
  };

  const acceptChallenge = async (id) => {
    const challengeRef = doc(db, "challenges", id);
    const challengeDoc = await getDoc(challengeRef);
    const currentAcceptedBy = challengeDoc.data().acceptedBy || [];
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    const userName = userDocSnap.exists() ? userDocSnap.data().name || "Anonymous" : "Anonymous";

    if (!currentAcceptedBy.some((entry) => entry.userId === user.uid)) {
      await updateDoc(challengeRef, {
        acceptedBy: [...currentAcceptedBy, { userId: user.uid, name: userName }],
      });
    }
  };

  const cancelAcceptance = async (id) => {
    const challengeRef = doc(db, "challenges", id);
    const challengeDoc = await getDoc(challengeRef);
    const currentAcceptedBy = challengeDoc.data().acceptedBy || [];

    await updateDoc(challengeRef, {
      acceptedBy: currentAcceptedBy.filter((entry) => entry.userId !== user.uid),
    });
  };

  const shareChallenge = (gameName, prize) => {
    const shareData = {
      title: `${gameName} Challenge`,
      text: `Compete in my ${gameName} challenge for $${prize}!`,
      url: window.location.href,
    };
    navigator.share?.(shareData) || alert("Sharing not supported");
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-950 p-4 sm:p-6 lg:p-8 pt-24 sm:pt-28 lg:pt-32"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Active Challenges</h1>
            <p className="text-gray-400 mt-1">Compete and win amazing prizes</p>
          </div>
          <Link
            to="/post-challenge"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-indigo-500/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Challenge
          </Link>
        </div>

        <AnimatePresence>
          {challenges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {challenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  user={user}
                  isEditing={editId === challenge.id}
                  newGameName={newGameName}
                  setNewGameName={setNewGameName}
                  newPrize={newPrize}
                  setNewPrize={setNewPrize}
                  handleEdit={handleEdit}
                  setEditId={setEditId}
                  handleDelete={handleDelete}
                  handleLike={handleLike}
                  acceptChallenge={acceptChallenge}
                  cancelAcceptance={cancelAcceptance}
                  shareChallenge={shareChallenge}
                />
              ))}
            </div>
          ) : (
            <motion.div
              className="text-center py-20 text-gray-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-800 rounded-full mb-6">
                <div className="text-4xl">🎮</div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Challenges Yet</h3>
              <p className="text-lg mb-6 max-w-md mx-auto">Be the first to create a challenge and start competing!</p>
              <Link
                to="/post-challenge"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-indigo-500/20"
              >
                Create Your Challenge
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}