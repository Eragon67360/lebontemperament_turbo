
// app/auth/update-password/page.tsx
import UpdatePasswordForm from '@/components/auth/UpdatePasswordForm'

export default function UpdatePasswordPage() {
    return (
        <>
            <div className="border w-[350px] md:w-[450px] rounded-lg mx-auto my-auto shadow-md">
                <div className="flex flex-col gap-4 p-6 md:p-10">
                    <div className="flex flex-1 items-center justify-center">
                        <div className="w-full max-w-xs">
                            <UpdatePasswordForm />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
