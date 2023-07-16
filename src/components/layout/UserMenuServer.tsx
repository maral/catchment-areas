// import { getServerSessionWithOptions } from "@/app/api/auth/[...nextauth]/config";
// import { UserCircleIcon } from "@heroicons/react/24/solid";
// import { Button, Icon } from "@tremor/react";
// import { signOut } from "next-auth/react";

// export default async function UserMenuServer() {
//   const session = await getServerSessionWithOptions();

//   if (session) {
//     return (
//       <div className="flex">
//         <Icon icon={UserCircleIcon} color="slate" size="xl" />
//         <span>{session.user?.name}</span>
//         <Button className="ml-2" onClick={() => signOut()}>
//           Odhlásit se
//         </Button>
//       </div>
//     );
//   } else {
//     return (
//       <div className="flex">
//         <Button className="ml-2">
//           <a href="/auth/signin">Přihlásit se</a>
//         </Button>
//       </div>
//     );
//   }
// }
