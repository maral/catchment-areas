"use client";

import LinkButton from "@/components/buttons/LinkButton";
import ConfirmDialog, {
  ConfirmFunction,
} from "@/components/common/ConfirmDialog";
import CatchmentTable from "@/components/table/CatchmentTable";
import { UserController } from "@/controllers/UserController";
import { User } from "@/entities/User";
import { Colors } from "@/styles/Themes";
import type { ColumnDefinition } from "@/types/tableTypes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Button } from "@tremor/react";
import { useState } from "react";
import { deserializeUsers, loadUsers } from "../fetchFunctions/loadUsers";
import { getRoleLabel } from "@/utils/shared/permissions";

export default function UsersTable({
  initialData,
  count,
}: {
  initialData: any[];
  count?: number;
}) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmFunction, setConfirmFunction] =
    useState<ConfirmFunction | null>(null);

  const renderActionButtons = (item: User, fetchData: () => Promise<void>) => (
    <div className="flex">
      <LinkButton
        className="mr-2"
        href={`${routes.users}/${item.id}`}
        buttonProps={{
          icon: PencilSquareIcon,
          color: Colors.Secondary,
        }}
      >
        {texts.edit}
      </LinkButton>
      <Button
        color={Colors.Error}
        icon={TrashIcon}
        onClick={() => {
          setConfirmFunction(() => async () => {
            await UserController.deleteOrdinance(item.id);
            await fetchData();
          });
          setIsConfirmOpen(true);
        }}
      >
        {texts.delete}
      </Button>
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
    <>
      <CatchmentTable
        columnDefinitions={columnDefinitions}
        fetchItems={loadUsers}
        count={count}
        initialData={deserializeUsers(initialData)}
      />

      <ConfirmDialog
        title={texts.deleteUserTitle}
        message={texts.deleteUserMessage}
        onConfirm={async () => {
          if (confirmFunction) {
            await confirmFunction();
          }
        }}
        isOpen={isConfirmOpen}
        setIsOpen={setIsConfirmOpen}
        confirmColor={Colors.Error}
        confirmText={texts.delete}
      />
    </>
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
