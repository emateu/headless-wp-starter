FROM alpine:3.21

RUN apk add --no-cache \
    mariadb-client \
    rclone

COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

RUN mkdir -p /backups

# Every 6 hours: 00:00, 06:00, 12:00, 18:00 UTC
RUN echo "0 */6 * * * /usr/local/bin/backup.sh >> /proc/1/fd/1 2>&1" > /etc/crontabs/root

CMD ["crond", "-f", "-l", "2"]
