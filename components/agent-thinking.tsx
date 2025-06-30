"use client";

import { motion } from "framer-motion";
import { BotIcon } from "./icons";
import { LoaderCircle, Sparkle } from "lucide-react";

export const AgentThinking = () => {
  return (
    <motion.div
      className={`flex flex-row gap-4 px-4 mb-5 w-full md:px-0`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 5, opacity: 0 }}
    >
      <div className="size-[15px] flex flex-col justify-center items-center flex-shrink-0 text-zinc-400 mt-1">
        <Sparkle className="text-red-600 animate-spin" />
      </div>
      
      <div className="flex flex-col mt-2 gap-2 items-start max-w-[90%] md:max-w-[95%] h-[49vh]">
        {/* Skeleton message bubble */}
        <div className="max-w-[100%] relative">
          <div className="flex flex-col gap-2 w-[100%]">
            {/* Skeleton lines */}
            <div className="flex flex-col gap-2">
              {/* First line - longer */}
              <div className="h-2 bg-gray-200 rounded-md w-[350px] animate-pulse"></div>
              
              {/* Second line - medium */}
              <div className="h-2 bg-gray-200 rounded-md w-[300px] animate-pulse"></div>
              
              {/* Third line - shorter */}
              <div className="h-2 bg-gray-200 rounded-md w-[250px] animate-pulse"></div>
            </div>
            
            {/* Loading indicator */}
            {/* <div className="flex items-center mt-2">
              <LoaderCircle size={17} className="animate-spin text-gray-300 mr-2" />
            </div> */}
          </div>
        </div>
      </div>
    </motion.div>
  );
};