create table MediaType
(
    id   bigint       not null
        primary key,
    code enum ('image', 'video', 'link') not null,
    name varchar(255) not null,
    constraint MediaType_pk_2
        unique (code)
);

create table Site
(
    id           bigint auto_increment
        primary key,
    name         varchar(255) null,
    url          varchar(255)                      not null,
    loginAdapter varchar(50) default 'xamvn-clone' not null,
    createdAt    datetime    default CURRENT_TIMESTAMP null,
    updatedAt    datetime    default CURRENT_TIMESTAMP null,
    deletedAt    datetime null,
    constraint Site_pk_2
        unique (url)
);

create table Forum
(
    id         bigint auto_increment
        primary key,
    siteId     bigint not null,
    name       varchar(255) null,
    originalId bigint null,
    createdAt  datetime default CURRENT_TIMESTAMP null,
    updatedAt  datetime default CURRENT_TIMESTAMP null,
    deletedAt  datetime null,
    constraint Forum_pk_2
        unique (siteId, originalId),
    constraint Forum_Site_id_fk
        foreign key (siteId) references Site (id)
);

create table Thread
(
    id          bigint auto_increment
        primary key,
    forumId     bigint null,
    originalId  bigint null,
    name        varchar(1024) null,
    lastMessage varchar(4000) null,
    description varchar(1024) null,
    createdAt   datetime default CURRENT_TIMESTAMP null,
    updatedAt   datetime default CURRENT_TIMESTAMP null,
    lastSyncAt  datetime null,
    deletedAt   datetime null,
    constraint Thread_pk_2
        unique (forumId, originalId),
    constraint Thread_Forum_id_fk
        foreign key (forumId) references Forum (id)
);

create table Post
(
    id         bigint auto_increment
        primary key,
    threadId   bigint not null,
    username   varchar(255) charset utf8mb3       null,
    userId     bigint null,
    content    varchar(4000) null,
    parentId   bigint null,
    originalId bigint null,
    createdAt  datetime default CURRENT_TIMESTAMP null,
    updatedAt  datetime default CURRENT_TIMESTAMP null,
    deletedAt  datetime null,
    constraint Post_pk_2
        unique (threadId, originalId),
    constraint Post_Thread_id_fk
        foreign key (threadId) references Thread (id)
);

create table Media
(
    id           bigint auto_increment
        primary key,
    postId       bigint not null,
    mediaTypeId  bigint not null,
    originalId   bigint null,
    caption      varchar(255) null,
    url          varchar(2048) null,
    filename     varchar(255) null,
    isDownloaded tinyint(1) default 0                 null,
    localPath    varchar(2048) null,
    mimeType     varchar(255) null,
    createdAt    datetime default CURRENT_TIMESTAMP null,
    updatedAt    datetime default CURRENT_TIMESTAMP null,
    deletedAt    datetime null,
    constraint Media_pk_2
        unique (postId, originalId),
    constraint Media_Post_id_fk
        foreign key (postId) references Post (id)
);

create table User
(
    id        bigint not null
        primary key,
    siteId    bigint not null,
    username  varchar(255) null,
    name      varchar(255) null,
    email     varchar(255) null,
    createdAt datetime default CURRENT_TIMESTAMP null,
    updatedAt datetime default CURRENT_TIMESTAMP null,
    deletedAt datetime null,
    constraint User_pk_2
        unique (siteId, username, email),
    constraint User_Site_id_fk
        foreign key (siteId) references Site (id)
);

