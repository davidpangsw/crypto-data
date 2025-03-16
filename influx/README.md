# Common commands for health-check
sudo systemctl status influxdb
sudo systemctl restart influxdb
journalctl -u influxdb
influx ping