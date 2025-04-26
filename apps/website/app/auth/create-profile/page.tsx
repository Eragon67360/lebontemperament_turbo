import CreateProfileForm from "@/components/auth/CreateProfileForm";

export default function CreateProfilePage() {
  return (
    <>
      <div className="border w-[350px] lg:w-[512px] rounded-lg mx-auto my-auto shadow-md">
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
