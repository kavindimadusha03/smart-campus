import { Star } from "lucide-react";
import { useState } from "react";

interface RatingStarsProps {
  rating?: number;       // Changed to optional
  max?: number;          // Added max prop
  onRate?: (rating: number) => void;
  interactive?: boolean;
  disabled?: boolean;    // Added disabled prop
}

export default function RatingStars({ 
  rating = 0, 
  max = 5, 
  onRate, 
  interactive = true, 
  disabled = false 
}: RatingStarsProps) {
  const [hover, setHover] = useState(0);

  // Helper to determine if we should allow interaction
  const canInteract = interactive && !disabled && !!onRate;

  return (
    <div className={`flex items-center gap-0.5 ${disabled ? "opacity-50" : ""}`}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={!canInteract}
          onMouseEnter={() => canInteract && setHover(star)}
          onMouseLeave={() => canInteract && setHover(0)}
          onClick={() => canInteract && onRate?.(star)}
          className={`${canInteract ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"}`}
        >
          <Star
            size={18}
            className={`${
              star <= (hover || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}