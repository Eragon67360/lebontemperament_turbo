import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function UpdatePasswordPage() {
  return (
    <>
      <div className="border-divider bg-background mx-auto my-auto w-[350px] rounded-lg border shadow-md md:w-[450px]">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <ResetPasswordForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
