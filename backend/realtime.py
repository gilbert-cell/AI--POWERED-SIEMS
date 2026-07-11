"""Entry point alias — delegates to realtime_logs.py"""
from realtime_logs import monitor
import sys

if __name__ == '__main__':
    duration = None
    dataset_interval = 2.0
    for arg in sys.argv[1:]:
        if arg.startswith('--duration='):
            duration = int(arg.split('=')[1])
        elif arg.startswith('--interval='):
            iv = float(arg.split('=')[1])
            if iv <= 0:
                print('--interval must be a positive number')
                sys.exit(1)
            dataset_interval = iv
    monitor(duration=duration, dataset_interval=dataset_interval)
