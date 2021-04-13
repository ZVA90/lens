import { observable } from "mobx";
import { autobind } from "../../utils";
import { KubeObjectStore } from "../../kube-object.store";
import { IPodMetrics, PodStatus, StatefulSet, statefulSetApi, getMetricsForStatefulSets } from "../../api/endpoints";
import { podsStore } from "../+workloads-pods/pods.store";
import { apiManager } from "../../api/api-manager";

@autobind()
export class StatefulSetStore extends KubeObjectStore<StatefulSet> {
  api = statefulSetApi;
  @observable metrics: IPodMetrics = null;

  async loadMetrics(statefulSet: StatefulSet) {
    this.metrics = await getMetricsForStatefulSets([statefulSet], statefulSet.getNs(), "");
  }

  getChildPods(statefulSet: StatefulSet) {
    return podsStore.getPodsByOwnerId(statefulSet.getId());
  }

  getStatuses(statefulSets: StatefulSet[]) {
    const status = { failed: 0, pending: 0, running: 0 };

    statefulSets.forEach(statefulSet => {
      const pods = this.getChildPods(statefulSet);

      if (pods.some(pod => pod.getStatus() === PodStatus.FAILED)) {
        status.failed++;
      }
      else if (pods.some(pod => pod.getStatus() === PodStatus.PENDING)) {
        status.pending++;
      }
      else {
        status.running++;
      }
    });

    return status;
  }

  reset() {
    this.metrics = null;
  }
}

export const statefulSetStore = new StatefulSetStore();
apiManager.registerStore(statefulSetStore);
