"use client";

import React from 'react';
import { Button, Icon } from "@tremor/react";
import { UserCircleIcon } from '@heroicons/react/24/solid';

export default function UserMenu () {
  const user = {
    name: "John Doe",
    email: "johndoe@gmail.com"
  };

  return (
    <>
      <div className="flex">
        <Icon
          icon={UserCircleIcon}
          color="slate"
          size="xl"
        />
        <span>{ user.name }</span>
        <Button className="ml-2">Logout</Button>
      </div>
    </>
  );
}