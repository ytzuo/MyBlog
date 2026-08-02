---
title: "Running Modern Middleware on an Offline RHEL 7 Server"
description: "Building PostgreSQL and Redis in a local CentOS 7 container"
slug: "modern-middleware-on-offline-rhel7"
pubDate: "2026-04-29"
tags: ["Docker", "Linux Operations", "Notes", "Databases", "Redis"]
lang: "en"
translationKey: "modern-middleware-offline-rhel7"
---

## The old server

A new project needed to avoid a long campus infrastructure process, so we searched for available machines and found four old RHEL 7.4 servers:

```bash
[root@service0 etc]# cat os-release
NAME="Red Hat Enterprise Linux Server"
VERSION="7.4 (Maipo)"
ID="rhel"
VERSION_ID="7.4"
PRETTY_NAME="Red Hat Enterprise Linux Server 7.4 (Maipo)"
```

The system was too old for the current packages of PostgreSQL 18 and Redis 7.0. The target server also had no Internet access, so installing modern RPM repositories was not practical.

The solution was to compile the software in a compatible local environment, package the output, and transfer it to the offline server.

## Preparing the local build environment

### Start a CentOS 7 container

My workstation ran Windows, so I used Docker and CentOS 7, which is compatible with the RHEL 7 target:

```bash
docker run -it --rm centos:7 bash
```

### Replace the retired CentOS repositories

CentOS 7 has reached end of life, so its normal repositories are no longer available. Point Yum to the Vault:

```bash
cat > /etc/yum.repos.d/CentOS-Base.repo <<'EOF'
[base]
name=CentOS-7.9.2009 - Base
baseurl=http://vault.centos.org/7.9.2009/os/$basearch/
enabled=1
gpgcheck=0

[updates]
name=CentOS-7.9.2009 - Updates
baseurl=http://vault.centos.org/7.9.2009/updates/$basearch/
enabled=1
gpgcheck=0

[extras]
name=CentOS-7.9.2009 - Extras
baseurl=http://vault.centos.org/7.9.2009/extras/$basearch/
enabled=1
gpgcheck=0
EOF

yum clean all
yum makecache
```

Install the common build dependencies:

```bash
yum install -y wget gcc make perl tar readline-devel zlib-devel bison flex
```

## Build PostgreSQL 18

Download, configure, compile, and verify PostgreSQL:

```bash
cd /usr/local/src
wget https://ftp.postgresql.org/pub/source/v18.0/postgresql-18.0.tar.gz
tar -zxvf postgresql-18.0.tar.gz
cd postgresql-18.0

./configure --prefix=/usr/local/pgsql18
make -j$(nproc)
make install

/usr/local/pgsql18/bin/postgres --version
/usr/local/pgsql18/bin/psql --version
```

Package the installed files inside the container:

```bash
cd /usr/local
tar -czvf /tmp/pgsql18-centos7-build.tar.gz pgsql18
```

Copy the package from the container on the host:

```bash
docker ps
docker cp CONTAINER_ID:/tmp/pgsql18-centos7-build.tar.gz .
```

### Deploy PostgreSQL on the offline server

Extract and verify:

```bash
cd /usr/local
tar -zxvf pgsql18-centos7-build.tar.gz
/usr/local/pgsql18/bin/postgres --version
```

Create the service account and initialize a data directory:

```bash
id postgres || useradd postgres
mkdir -p /data/pgsql18
chown -R postgres:postgres /data/pgsql18

su - postgres
/usr/local/pgsql18/bin/initdb -D /data/pgsql18
exit
```

Create `/etc/systemd/system/postgresql-18.service`:

```ini
[Unit]
Description=PostgreSQL 18 database server
After=network.target

[Service]
Type=forking
User=postgres
Group=postgres
Environment=PGDATA=/data/pgsql18
ExecStart=/usr/local/pgsql18/bin/pg_ctl start -D ${PGDATA} -s -w -t 300
ExecStop=/usr/local/pgsql18/bin/pg_ctl stop -D ${PGDATA} -s -m fast
ExecReload=/usr/local/pgsql18/bin/pg_ctl reload -D ${PGDATA} -s
TimeoutSec=300

[Install]
WantedBy=multi-user.target
```

Enable and check the service:

```bash
systemctl daemon-reload
systemctl enable --now postgresql-18
systemctl status postgresql-18
ss -lntp | grep 5432
```

## Build Redis 7.0.15

Redis can be built with the system allocator to avoid an incompatible jemalloc build:

```bash
cd /usr/local/src
wget https://download.redis.io/releases/redis-7.0.15.tar.gz
tar -zxvf redis-7.0.15.tar.gz
cd redis-7.0.15

make distclean
make -j$(nproc) MALLOC=libc

src/redis-server --version
src/redis-cli --version
```

Prepare a self-contained installation directory:

```bash
mkdir -p /usr/local/redis7/{bin,etc,data,log,run}

cp src/redis-server /usr/local/redis7/bin/
cp src/redis-cli /usr/local/redis7/bin/
cp src/redis-benchmark /usr/local/redis7/bin/
cp src/redis-check-aof /usr/local/redis7/bin/
cp src/redis-check-rdb /usr/local/redis7/bin/
cp redis.conf /usr/local/redis7/etc/redis.conf
```

Adjust the basic paths and bind address:

```bash
sed -i 's/^bind 127.0.0.1 -::1/bind 127.0.0.1/' /usr/local/redis7/etc/redis.conf
sed -i 's/^daemonize no/daemonize no/' /usr/local/redis7/etc/redis.conf
sed -i 's|^dir ./|dir /usr/local/redis7/data|' /usr/local/redis7/etc/redis.conf
sed -i 's|^logfile ""|logfile "/usr/local/redis7/log/redis.log"|' /usr/local/redis7/etc/redis.conf
sed -i 's|^pidfile /var/run/redis_6379.pid|pidfile /usr/local/redis7/run/redis_6379.pid|' /usr/local/redis7/etc/redis.conf
```

Package and export the result:

```bash
cd /usr/local
tar -czvf /tmp/redis7-centos7-build.tar.gz redis7

# Run on the host:
docker ps
docker cp CONTAINER_ID:/tmp/redis7-centos7-build.tar.gz .
```

### Deploy Redis on the offline server

```bash
cd /usr/local
tar -zxvf redis7-centos7-build.tar.gz

/usr/local/redis7/bin/redis-server --version
/usr/local/redis7/bin/redis-cli --version

id redis || useradd -r -s /sbin/nologin redis
chown -R redis:redis /usr/local/redis7
```

Create `/etc/systemd/system/redis7.service`:

```ini
[Unit]
Description=Redis 7.0 Server
After=network.target

[Service]
Type=simple
User=redis
Group=redis
ExecStart=/usr/local/redis7/bin/redis-server /usr/local/redis7/etc/redis.conf
ExecStop=/usr/local/redis7/bin/redis-cli -h 127.0.0.1 -p 6379 shutdown
Restart=always
RestartSec=3
LimitNOFILE=100000

[Install]
WantedBy=multi-user.target
```

Enable and test:

```bash
systemctl daemon-reload
systemctl enable --now redis7
systemctl status redis7
ss -lntp | grep 6379
/usr/local/redis7/bin/redis-cli -h 127.0.0.1 -p 6379 ping
```

## Summary

An offline RHEL 7 server is a poor target for forcing modern RPM packages into place. Building PostgreSQL 18 and Redis 7.0 inside a compatible CentOS 7 container produced binaries with the right system compatibility. Those artifacts could then be uploaded, extracted, and managed cleanly through systemd.
