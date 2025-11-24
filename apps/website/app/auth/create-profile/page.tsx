import CreateProfileForm from "@/components/auth/CreateProfileForm";

export default function CreateProfilePage() {
  return (
    <>
      <div className="border-divider bg-background mx-auto my-auto w-[350px] rounded-lg border shadow-md lg:w-[512px]">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <CreateProfileForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
