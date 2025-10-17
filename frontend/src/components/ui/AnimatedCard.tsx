"use client";

import { motion } from "framer-motion";
import { cardVariants } from "@/lib/animations";
import { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedCard({
  children,
  className = "",
  delay = 0,
}: AnimatedCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      className={className}
      transition={{ delay }}>
      {children}
    </motion.div>
  );
}
