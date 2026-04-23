import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9c2.14 0 4.1-.75 5.65-2"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"/>
              <path d="M15 11l2.5 2.5L22 9"
                    stroke="#4ADE80"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-white">CES</h1>
            <p className="text-sm text-white/50">Contract Evaluation System</p>
          </div>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-[#16181D] border border-white/10",
              headerTitle: "text-white",
              headerSubtitle: "text-white/60",
              socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10",
              formFieldLabel: "text-white/70",
              formFieldInput: "bg-white/5 border-white/10 text-white",
              footerActionLink: "text-indigo-400 hover:text-indigo-300",
              formButtonPrimary: "bg-indigo-500 hover:bg-indigo-600",
            },
          }}
        />
      </div>
    </div>
  );
}
