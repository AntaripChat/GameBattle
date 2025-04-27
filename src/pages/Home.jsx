import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaRocket } from "react-icons/fa";

export default function Home() {
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-[96px] sm:pt-[104px] lg:pt-[112px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="bg-gray-800 rounded-xl shadow-lg p-8 sm:p-10 max-w-lg w-full text-center border border-gray-700"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.h1
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Welcome to ChallengeMe
        </motion.h1>
        <motion.p
          className="text-lg sm:text-xl text-gray-300 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          Challenge friends, compete in exciting games, and win amazing prizes!
        </motion.p>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-base sm:text-lg font-medium"
          >
            <FaRocket className="w-5 h-5" />
            Get Started
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}