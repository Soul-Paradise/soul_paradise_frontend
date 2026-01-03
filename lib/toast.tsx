import toast from "react-hot-toast";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastOptions {
  title: string;
  body?: string;
  type?: ToastType;
}

const styles: Record<ToastType, any> = {
  success: {
    icon: CheckCircle,
    border: "from-green-400 to-emerald-600",
    bg: "bg-green-50/70",
    text: "text-green-900",
  },
  error: {
    icon: XCircle,
    border: "from-red-400 to-rose-600",
    bg: "bg-red-50/70",
    text: "text-red-900",
  },
  warning: {
    icon: AlertTriangle,
    border: "from-yellow-400 to-orange-500",
    bg: "bg-yellow-50/70",
    text: "text-yellow-900",
  },
  info: {
    icon: Info,
    border: "from-blue-400 to-indigo-600",
    bg: "bg-blue-50/70",
    text: "text-blue-900",
  },
};

export const showToast = ({
  title,
  body,
  type = "info",
}: ToastOptions) => {
  const { icon: Icon, border, bg, text } = styles[type];

  toast.custom((t) => (
    <div
      className={`
        ${t.visible ? "animate-slide-in" : "animate-slide-out"}
        relative w-[360px] overflow-hidden rounded-xl
        backdrop-blur-md ${bg}
        shadow-xl ring-1 ring-black/5
      `}
    >
      {/* Gradient Accent */}
      <div className={`h-1 w-full bg-gradient-to-r ${border}`} />

      <div className="flex gap-3 p-4">
        <Icon className={`h-6 w-6 ${text}`} />

        <div className="flex-1">
          <p className={`text-sm font-semibold ${text}`}>{title}</p>
          {body && (
            <p className="mt-1 text-sm text-gray-600 leading-snug">
              {body}
            </p>
          )}
        </div>

        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          ✕
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gray-200">
        <div
          className={`h-full bg-gradient-to-r ${border} animate-toast-progress`}
        />
      </div>
    </div>
  ));
};
