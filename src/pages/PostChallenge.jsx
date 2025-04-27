import { useState } from "react";
import { db, realtimeDb } from "../services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, set } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom"; // Add useNavigate
import { motion } from "framer-motion";
import { FaGamepad, FaDollarSign, FaPaperPlane } from "react-icons/fa";

const PostChallenge = () => {
  const { user } = useAuth();
  const [gameName, setGameName] = useState("");
  const [prize, setPrize] = useState("");
  const navigate = useNavigate(); // Initialize navigate

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!gameName || !prize) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const challengeRef = await addDoc(collection(db, "challenges"), {
        gameName,
        prize,
        createdAt: serverTimestamp(),
        userId: user.uid,
        likes: [],
      });

      await set(ref(realtimeDb, `challengeGroups/${challengeRef.id}`), {
        challengeId: challengeRef.id,
        gameName,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      console.log(`Group created for challenge: ${challengeRef.id}`);
      setGameName("");
      setPrize("");
      alert("Challenge and group created!");
      navigate("/dashboard"); // Redirect to Dashboard
    } catch (error) {
      console.error("Error posting challenge:", error);
      alert("Failed to post challenge");
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 p-4 sm:p-6 lg:p-8 pt-[96px] sm:pt-[104px] lg:pt-[112px] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="bg-gray-800 rounded-xl shadow-sm p-6 sm:p-8 w-full max-w-md border border-gray-700"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6">
          Post a New Challenge
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Game Name
            </label>
            <motion.div className="relative">
              <FaGamepad className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <motion.select
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200 placeholder-gray-400 transition-colors appearance-none"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                aria-label="Select game name"
              >
                <option value="" disabled>
                  Select a game
                </option>
                {games.map((game) => (
                  <option key={game} value={game} className="bg-gray-700 text-gray-200">
                    {game}
                  </option>
                ))}
              </motion.select>
            </motion.div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Prize Amount ($)
            </label>
            <motion.div className="relative">
              <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <motion.input
                type="number"
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200 placeholder-gray-400 transition-colors"
                placeholder="Enter prize amount"
                value={prize}
                onChange={(e) => setPrize(e.target.value)}
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
          </div>

          <motion.button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            aria-label="Post new challenge"
          >
            <FaPaperPlane className="w-4 h-4" />
            Post Challenge
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default PostChallenge;