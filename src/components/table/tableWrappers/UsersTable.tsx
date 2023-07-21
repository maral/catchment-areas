'use client';

import CatchmentTable from "@/components/table/CatchmentTable";
import { remult } from "remult";
import { User } from "@/entities/User";
import type { ColumnDefinition } from "@/types/tableTypes";
import { texts } from "@/utils/shared/texts";
import { Role } from "@/entities/User";
import LinkButton from "@/components/buttons/LinkButton";
import { Colors } from "@/styles/Themes";
import { Button } from "@tremor/react";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/solid";
import { deserializeUsers } from "../fetchFunctions/loadUsers";
import { routes } from "@/utils/shared/constants";

const usersRepo = remult.repo(User);

export default function UsersTable({
  initialData,
  count,
}: {
  initialData: any[];
  count?: number;
}) {
  const renderActionButtons = (item: User) => (
    <div className="flex">
      <LinkButton
        className="mr-2"
        href={`${routes.users}/${item.id}`}
        buttonProps={{
          icon: PencilSquareIcon,
          color: Colors.Secondary
        }}
      >
        {texts.edit}
      </LinkButton>
      <Button
        color={Colors.Error}
        icon={TrashIcon}
        onClick={() => {
          console.log("delete btn click", item.id);
        }}
      >
        {texts.delete}
      </Button>
    </div>
  );


  const columnDefinitions: ColumnDefinition<User>[] = [
    {
      title: texts.fullName,
      cellFactory: (item) => item.name
    },
    {
      title: texts.email,
      cellFactory: (item) => item.email
    },
    {
      title: texts.emailVerified,
      cellFactory: (item) => item.emailVerified ?? texts.unverified
    },
    {
      title: texts.role,
      cellFactory: (item) => item.role === Role.Admin ? texts.admin : texts.user
    },
    {
      title: '',
      cellFactory: (item) => renderActionButtons(item)
    }
  ];

  const fetchItems = async (page: number, limit: number) => {
    return usersRepo.find({
      limit,
      page,
      orderBy: { name: "asc" },
    });
  };

  return (
    <CatchmentTable
      columnDefinitions={columnDefinitions}
      fetchItems={fetchItems}
      count={count}
      initialData={deserializeUsers(initialData)}
    />
  );
}
