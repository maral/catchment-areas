"use client";

import LinkButton from "@/components/buttons/LinkButton";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import CatchmentTable from "@/components/table/CatchmentTable";
import { Button } from "@/components/ui/button";
import { UserController } from "@/controllers/UserController";
import { User } from "@/entities/User";
import type { ColumnDefinition } from "@/types/tableTypes";
import { routes } from "@/utils/shared/constants";
import { getRoleLabel } from "@/utils/shared/permissions";
import { texts } from "@/utils/shared/texts";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/solid";
import { deserializeUsers, loadUsers } from "../fetchFunctions/loadUsers";

export default function UsersTable({ initialData }: { initialData: any[] }) {
  const renderActionButtons = (item: User, fetchData: () => Promise<void>) => (
    <div className="flex">
      <LinkButton
        className="mr-2"
        href={`${routes.users}/${item.id}`}
        buttonProps={{
          variant: "secondary",
        }}
      >
        <PencilSquareIcon />
        {texts.edit}
      </LinkButton>
      <ConfirmDialog
        title={texts.deleteUserTitle}
        message={texts.deleteUserMessage}
        onConfirm={async () => {
          await UserController.deleteUser(item.id);
          await fetchData();
        }}
        confirmButtonVariant="destructive"
        confirmText={texts.delete}
      >
        <Button variant="destructive">
          <TrashIcon />
          {texts.delete}
        </Button>
      </ConfirmDialog>
    </div>
  );

  const columnDefinitions: ColumnDefinition<User>[] = [
    {
      title: texts.fullName,
      cellFactory: (item) => (
        <Cell user={item}>
          {item.name}
          {item.email.length === 0 && ` (${texts.notRegistered})`}
        </Cell>
      ),
    },
    {
      title: texts.email,
      cellFactory: (item) => (
        <Cell user={item}>
          {item.email.length === 0 ? item.futureEmail : item.email}
        </Cell>
      ),
    },
    {
      title: texts.role,
      cellFactory: (item) => <Cell user={item}>{getRoleLabel(item.role)}</Cell>,
    },
    {
      title: "",
      cellFactory: (item, fetchItems) => renderActionButtons(item, fetchItems),
    },
  ];

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      fetchItems={loadUsers}
      initialData={deserializeUsers(initialData)}
    />
  );
}

function Cell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <span
      className={`${user.email.length === 0 ? "text-gray-400 italic" : ""}`}
    >
      {children}
    </span>
  );
}
