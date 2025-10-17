"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  decimals?: number;
  suffix?: string;
}

export function AnimatedNumber({
  value,
  className = "",
  decimals = 0,
  suffix = "",
}: AnimatedNumberProps) {
  const spring = useSpring(0, {
    stiffness: 50,
    damping: 15,
    mass: 0.5,
  });

  const display = useTransform(
    spring,
    (current) => current.toFixed(decimals) + suffix
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
}
